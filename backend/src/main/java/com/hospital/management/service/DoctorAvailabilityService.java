package com.hospital.management.service;

import com.hospital.management.dto.AvailableSlotDTO;
import com.hospital.management.exception.BadRequestException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.model.Appointment;
import com.hospital.management.model.AppointmentStatus;
import com.hospital.management.model.Doctor;
import com.hospital.management.model.DoctorAvailability;
import com.hospital.management.model.User;
import com.hospital.management.repository.AppointmentRepository;
import com.hospital.management.repository.DoctorAvailabilityRepository;
import com.hospital.management.repository.DoctorRepository;
import com.hospital.management.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
public class DoctorAvailabilityService {

    // Length of one appointment slot
    public static final int SLOT_MINUTES = 30;

    @Value("${app.timezone:Asia/Kolkata}")
    private String timezone;

    private LocalDate today() {
        return LocalDate.now(ZoneId.of(timezone));
    }

    private LocalTime now() {
        return LocalTime.now(ZoneId.of(timezone));
    }

    private void validateAvailability(DoctorAvailability availability) {

        if (availability == null
                || availability.getAvailableDate() == null
                || availability.getStartTime() == null
                || availability.getEndTime() == null
                || availability.getDoctor() == null
                || availability.getDoctor().getId() == null) {

            throw new BadRequestException(
                    "Doctor, date, start time and end time are required");
        }

        if (availability.getAvailableDate().isBefore(today())) {
            throw new BadRequestException(
                    "Availability date cannot be in the past");
        }

        if (!availability.getStartTime().isBefore(availability.getEndTime())) {
            throw new BadRequestException(
                    "Start time must be before end time");
        }
    }

    @Autowired
    private DoctorAvailabilityRepository doctorAvailabilityRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;


    // =========================================================
    // CREATE AVAILABILITY
    // =========================================================

    public DoctorAvailability createAvailability(
            DoctorAvailability availability) {

        validateAvailability(availability);

        // Never trust id coming from the client
        availability.setId(null);

        Doctor doctor =
                doctorRepository.findById(
                        availability.getDoctor().getId()
                ).orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Doctor not found"
                        )
                );

        // Doctor can create availability only for himself
        checkDoctorOwnership(doctor);

        List<DoctorAvailability> existing =
                doctorAvailabilityRepository
                        .findByDoctorIdAndAvailableDate(
                                doctor.getId(),
                                availability.getAvailableDate()
                        );

        for (DoctorAvailability item : existing) {

            boolean overlaps =
                    availability.getStartTime()
                            .isBefore(item.getEndTime())
                            &&
                            availability.getEndTime()
                                    .isAfter(item.getStartTime());

            if (overlaps) {

                throw new BadRequestException(
                        "Doctor already has availability during this time"
                );
            }
        }

        availability.setDoctor(doctor);

        return doctorAvailabilityRepository.save(
                availability
        );
    }


    // =========================================================
    // GET ALL AVAILABILITY
    // =========================================================

    public List<DoctorAvailability> getAllAvailability() {

        return doctorAvailabilityRepository.findAll();
    }


    // =========================================================
    // GET AVAILABILITY BY DOCTOR
    // =========================================================

    public List<DoctorAvailability> getAvailabilityByDoctor(
            Long doctorId) {

        if (!doctorRepository.existsById(doctorId)) {

            throw new ResourceNotFoundException(
                    "Doctor not found"
            );
        }

        return doctorAvailabilityRepository
                .findByDoctorId(doctorId);
    }


    // =========================================================
    // GET AVAILABILITY BY DOCTOR AND DATE
    // =========================================================

    public List<DoctorAvailability>
    getAvailabilityByDoctorAndDate(
            Long doctorId,
            LocalDate date) {

        if (!doctorRepository.existsById(doctorId)) {

            throw new ResourceNotFoundException(
                    "Doctor not found"
            );
        }

        return doctorAvailabilityRepository
                .findByDoctorIdAndAvailableDate(
                        doctorId,
                        date
                );
    }


    // =========================================================
    // GET AVAILABLE SLOTS
    // =========================================================

    public List<AvailableSlotDTO> getAvailableSlots(
            Long doctorId,
            LocalDate date) {

        if (!doctorRepository.existsById(doctorId)) {

            throw new ResourceNotFoundException(
                    "Doctor not found"
            );
        }

        List<DoctorAvailability> availabilities =
                doctorAvailabilityRepository
                        .findByDoctorIdAndAvailableDate(
                                doctorId,
                                date
                        );

        List<Appointment> appointments =
                appointmentRepository
                        .findByDoctorIdAndAppointmentDate(
                                doctorId,
                                date
                        );

        List<AvailableSlotDTO> slots =
                new ArrayList<>();

        for (DoctorAvailability availability : availabilities) {

            LocalTime slotTime =
                    availability.getStartTime();

            while (slotTime.isBefore(
                    availability.getEndTime())) {

                boolean booked = false;

                for (Appointment appointment : appointments) {

                    if (appointment.getAppointmentTime()
                            .equals(slotTime)
                            &&
                            appointment.getStatus()
                                    != AppointmentStatus.CANCELLED) {

                        booked = true;
                        break;
                    }
                }

                boolean inPast = date.isBefore(today())
                        || (date.isEqual(today())
                        && slotTime.isBefore(now()));

                if (!booked && !inPast) {

                    slots.add(
                            new AvailableSlotDTO(
                                    slotTime.toString(),
                                    true
                            )
                    );
                }

                LocalTime next =
                        slotTime.plusMinutes(SLOT_MINUTES);

                // stop if the time wraps past midnight
                if (!next.isAfter(slotTime)) {
                    break;
                }

                slotTime = next;
            }
        }

        return slots;
    }


    // =========================================================
    // GET AVAILABILITY BY ID
    // =========================================================

    public DoctorAvailability getAvailabilityById(
            Long id) {

        return doctorAvailabilityRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Availability not found"
                        )
                );
    }


    // =========================================================
    // UPDATE AVAILABILITY
    // =========================================================

    public DoctorAvailability updateAvailability(
            Long id,
            DoctorAvailability availability) {

        DoctorAvailability existingAvailability =
                doctorAvailabilityRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Availability not found"
                                )
                        );

        validateAvailability(availability);

        Doctor requestedDoctor =
                doctorRepository.findById(
                        availability.getDoctor().getId()
                ).orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Doctor not found"
                        )
                );

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String role =
                authentication.getAuthorities()
                        .iterator()
                        .next()
                        .getAuthority();

        // Doctor can update only his own availability
        if (role.equals("ROLE_DOCTOR")) {

            Doctor loggedInDoctor =
                    getLoggedInDoctor();

            if (!existingAvailability.getDoctor()
                    .getId()
                    .equals(loggedInDoctor.getId())) {

                throw new AccessDeniedException(
                        "You can update only your own availability"
                );
            }

            // Doctor cannot transfer availability to another doctor
            if (!requestedDoctor.getId()
                    .equals(loggedInDoctor.getId())) {

                throw new AccessDeniedException(
                        "You cannot change the doctor"
                );
            }
        }

        List<DoctorAvailability> existing =
                doctorAvailabilityRepository
                        .findByDoctorIdAndAvailableDate(
                                requestedDoctor.getId(),
                                availability.getAvailableDate()
                        );

        for (DoctorAvailability item : existing) {

            if (item.getId().equals(id)) {
                continue;
            }

            boolean overlaps =
                    availability.getStartTime()
                            .isBefore(item.getEndTime())
                            &&
                            availability.getEndTime()
                                    .isAfter(item.getStartTime());

            if (overlaps) {

                throw new BadRequestException(
                        "Doctor already has availability during this time"
                );
            }
        }

        existingAvailability.setAvailableDate(
                availability.getAvailableDate()
        );

        existingAvailability.setStartTime(
                availability.getStartTime()
        );

        existingAvailability.setEndTime(
                availability.getEndTime()
        );

        existingAvailability.setDoctor(
                requestedDoctor
        );

        return doctorAvailabilityRepository.save(
                existingAvailability
        );
    }


    // =========================================================
    // DELETE AVAILABILITY
    // =========================================================

    public void deleteAvailability(Long id) {

        DoctorAvailability availability =
                doctorAvailabilityRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Availability not found"
                                )
                        );

        // Doctor can delete only own availability, admin any
        checkDoctorOwnership(availability.getDoctor());

        doctorAvailabilityRepository.delete(availability);
    }


    // =========================================================
    // CHECK DOCTOR OWNERSHIP
    // =========================================================

    private void checkDoctorOwnership(
            Doctor requestedDoctor) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String role =
                authentication.getAuthorities()
                        .iterator()
                        .next()
                        .getAuthority();

        // Admin can manage any doctor
        if (role.equals("ROLE_ADMIN")) {
            return;
        }

        // Doctor can manage only himself
        if (role.equals("ROLE_DOCTOR")) {

            Doctor loggedInDoctor =
                    getLoggedInDoctor();

            if (!requestedDoctor.getId()
                    .equals(loggedInDoctor.getId())) {

                throw new AccessDeniedException(
                        "You can manage only your own availability"
                );
            }

            return;
        }

        throw new AccessDeniedException(
                "You are not allowed to manage availability"
        );
    }


    // =========================================================
    // GET LOGGED-IN DOCTOR
    // =========================================================

    private Doctor getLoggedInDoctor() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String email =
                authentication.getName();

        User user =
                userRepository.findByEmail(email)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "User not found"
                                )
                        );

        return doctorRepository.findByUserId(user.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Doctor profile not found"
                        )
                );
    }
}