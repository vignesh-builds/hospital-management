package com.hospital.management.service;

import com.hospital.management.dto.AppointmentResponseDTO;
import com.hospital.management.exception.AppointmentAlreadyBookedException;
import com.hospital.management.exception.AppointmentValidationException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.model.Appointment;
import com.hospital.management.model.AppointmentStatus;
import com.hospital.management.model.Doctor;
import com.hospital.management.model.DoctorAvailability;
import com.hospital.management.model.Patient;
import com.hospital.management.model.User;
import com.hospital.management.repository.AppointmentRepository;
import com.hospital.management.repository.DoctorAvailabilityRepository;
import com.hospital.management.repository.DoctorRepository;
import com.hospital.management.repository.PatientRepository;
import com.hospital.management.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorAvailabilityRepository doctorAvailabilityRepository;


    // =========================================================
    // CREATE / BOOK APPOINTMENT
    // =========================================================

    public AppointmentResponseDTO createAppointment(
            Appointment appointment) {

        validateDateAndTime(
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime()
        );

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String email = authentication.getName();

        User loggedInUser =
                getUserByEmail(email);

        Patient patient;

        // PATIENT → automatically use own profile
        if ("PATIENT".equals(loggedInUser.getRole())) {

            patient =
                    patientRepository.findByUserId(
                            loggedInUser.getId()
                    ).orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Patient profile not found"
                            )
                    );

        }

        // ADMIN → choose patient
        else {

            if (appointment.getPatient() == null
                    || appointment.getPatient().getId() == null) {

                throw new AppointmentValidationException(
                        "Patient is required"
                );
            }

            patient =
                    patientRepository.findById(
                            appointment.getPatient().getId()
                    ).orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Patient not found"
                            )
                    );
        }


        // Doctor validation
        Doctor doctor =
                getDoctorFromAppointment(appointment);

        // Availability
        checkDoctorAvailability(
                doctor,
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime()
        );

        // Double booking
        checkDoubleBooking(
                doctor,
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime(),
                null
        );


        appointment.setPatient(patient);
        appointment.setDoctor(doctor);

        appointment.setStatus(
                AppointmentStatus.BOOKED
        );

        Appointment saved =
                appointmentRepository.save(
                        appointment
                );

        return convertToDTO(saved);
    }


    // =========================================================
    // GET ALL APPOINTMENTS
    // =========================================================

    public List<AppointmentResponseDTO> getAllAppointments() {

        return appointmentRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }


    // =========================================================
    // GET MY APPOINTMENTS - PATIENT
    // =========================================================

    public List<AppointmentResponseDTO> getMyAppointments() {

        User user =
                getLoggedInUser();

        Patient patient =
                patientRepository.findByUserId(
                        user.getId()
                ).orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Patient profile not found"
                        )
                );

        return appointmentRepository
                .findByPatientId(patient.getId())
                .stream()
                .map(this::convertToDTO)
                .toList();
    }


    // =========================================================
    // GET APPOINTMENTS BY PATIENT
    // =========================================================

    public List<AppointmentResponseDTO>
    getAppointmentsByPatient(Long patientId) {

        User user =
                getLoggedInUser();

        // Patient can see only own appointments
        if ("PATIENT".equals(user.getRole())) {

            Patient patient =
                    patientRepository.findByUserId(
                            user.getId()
                    ).orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Patient profile not found"
                            )
                    );

            if (!patient.getId().equals(patientId)) {

                throw new RuntimeException(
                        "You can access only your own appointments"
                );
            }
        }

        return appointmentRepository
                .findByPatientId(patientId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }


    // =========================================================
    // GET DOCTOR APPOINTMENTS
    // =========================================================

    public List<AppointmentResponseDTO>
    getAppointmentsByDoctor() {

        Doctor doctor =
                getLoggedInDoctor();

        return appointmentRepository
                .findByDoctorId(doctor.getId())
                .stream()
                .map(this::convertToDTO)
                .toList();
    }


    // =========================================================
    // GET APPOINTMENT BY ID
    // =========================================================

    public AppointmentResponseDTO
    getAppointmentById(Long id) {

        Appointment appointment =
                getAppointment(id);

        return convertToDTO(appointment);
    }


    // =========================================================
    // UPDATE APPOINTMENT
    // =========================================================

    public AppointmentResponseDTO updateAppointment(
            Long id,
            Appointment appointment) {

        Appointment existing =
                getAppointment(id);

        User user =
                getLoggedInUser();

        // Doctor can modify only own appointment
        if ("DOCTOR".equals(user.getRole())) {

            Doctor doctor =
                    getLoggedInDoctor();

            checkDoctorOwnership(
                    existing,
                    doctor
            );
        }


        validateDateAndTime(
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime()
        );


        Doctor doctor =
                getDoctorFromAppointment(appointment);


        checkDoctorAvailability(
                doctor,
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime()
        );


        checkDoubleBooking(
                doctor,
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime(),
                id
        );


        Patient patient;

        if (appointment.getPatient() == null
                || appointment.getPatient().getId() == null) {

            patient = existing.getPatient();

        } else {

            patient =
                    patientRepository.findById(
                            appointment.getPatient().getId()
                    ).orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Patient not found"
                            )
                    );
        }


        existing.setAppointmentDate(
                appointment.getAppointmentDate()
        );

        existing.setAppointmentTime(
                appointment.getAppointmentTime()
        );

        existing.setDoctor(doctor);

        existing.setPatient(patient);


        if (appointment.getStatus() != null) {
            existing.setStatus(
                    appointment.getStatus()
            );
        }


        Appointment updated =
                appointmentRepository.save(existing);

        return convertToDTO(updated);
    }


    // =========================================================
    // CONFIRM APPOINTMENT
    // =========================================================

    public AppointmentResponseDTO
    confirmAppointment(Long id) {

        Appointment appointment =
                getAppointment(id);

        Doctor doctor =
                getLoggedInDoctor();

        checkDoctorOwnership(
                appointment,
                doctor
        );


        if (appointment.getStatus()
                != AppointmentStatus.BOOKED) {

            throw new AppointmentValidationException(
                    "Only BOOKED appointments can be confirmed"
            );
        }


        appointment.setStatus(
                AppointmentStatus.CONFIRMED
        );


        Appointment saved =
                appointmentRepository.save(
                        appointment
                );

        return convertToDTO(saved);
    }


    // =========================================================
    // COMPLETE APPOINTMENT
    // =========================================================

    public AppointmentResponseDTO
    completeAppointment(Long id) {

        Appointment appointment =
                getAppointment(id);

        Doctor doctor =
                getLoggedInDoctor();

        checkDoctorOwnership(
                appointment,
                doctor
        );


        if (appointment.getStatus()
                != AppointmentStatus.CONFIRMED) {

            throw new AppointmentValidationException(
                    "Only CONFIRMED appointments can be completed"
            );
        }


        appointment.setStatus(
                AppointmentStatus.COMPLETED
        );


        Appointment saved =
                appointmentRepository.save(
                        appointment
                );

        return convertToDTO(saved);
    }


    // =========================================================
    // CANCEL APPOINTMENT
    // =========================================================

    public AppointmentResponseDTO
    cancelAppointment(Long id) {

        Appointment appointment =
                getAppointment(id);

        User user =
                getLoggedInUser();


        // Doctor → own appointment only
        if ("DOCTOR".equals(user.getRole())) {

            Doctor doctor =
                    getLoggedInDoctor();

            checkDoctorOwnership(
                    appointment,
                    doctor
            );
        }


        // Patient → own appointment only
        if ("PATIENT".equals(user.getRole())) {

            Patient patient =
                    patientRepository.findByUserId(
                            user.getId()
                    ).orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Patient profile not found"
                            )
                    );

            if (!appointment.getPatient()
                    .getId()
                    .equals(patient.getId())) {

                throw new RuntimeException(
                        "You can cancel only your own appointment"
                );
            }
        }


        if (appointment.getStatus()
                == AppointmentStatus.COMPLETED) {

            throw new AppointmentValidationException(
                    "Completed appointment cannot be cancelled"
            );
        }


        if (appointment.getStatus()
                == AppointmentStatus.CANCELLED) {

            throw new AppointmentValidationException(
                    "Appointment is already cancelled"
            );
        }


        appointment.setStatus(
                AppointmentStatus.CANCELLED
        );


        Appointment saved =
                appointmentRepository.save(
                        appointment
                );

        return convertToDTO(saved);
    }


    // =========================================================
    // RESCHEDULE APPOINTMENT
    // =========================================================

    public AppointmentResponseDTO
    rescheduleAppointment(
            Long id,
            LocalDate newDate,
            LocalTime newTime) {

        Appointment appointment =
                getAppointment(id);

        User user =
                getLoggedInUser();


        // Patient can reschedule only own appointment
        if ("PATIENT".equals(user.getRole())) {

            Patient patient =
                    patientRepository.findByUserId(
                            user.getId()
                    ).orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Patient profile not found"
                            )
                    );

            if (!appointment.getPatient()
                    .getId()
                    .equals(patient.getId())) {

                throw new RuntimeException(
                        "You can reschedule only your own appointment"
                );
            }
        }


        // Doctor can reschedule only own appointment
        if ("DOCTOR".equals(user.getRole())) {

            Doctor doctor =
                    getLoggedInDoctor();

            checkDoctorOwnership(
                    appointment,
                    doctor
            );
        }


        // Cancelled cannot reschedule
        if (appointment.getStatus()
                == AppointmentStatus.CANCELLED) {

            throw new AppointmentValidationException(
                    "Cancelled appointment cannot be rescheduled"
            );
        }


        // Completed cannot reschedule
        if (appointment.getStatus()
                == AppointmentStatus.COMPLETED) {

            throw new AppointmentValidationException(
                    "Completed appointment cannot be rescheduled"
            );
        }


        validateDateAndTime(
                newDate,
                newTime
        );


        Doctor doctor =
                appointment.getDoctor();


        checkDoctorAvailability(
                doctor,
                newDate,
                newTime
        );


        checkDoubleBooking(
                doctor,
                newDate,
                newTime,
                id
        );


        appointment.setAppointmentDate(
                newDate
        );

        appointment.setAppointmentTime(
                newTime
        );


        Appointment saved =
                appointmentRepository.save(
                        appointment
                );

        return convertToDTO(saved);
    }


    // =========================================================
    // DELETE APPOINTMENT
    // =========================================================

    public void deleteAppointment(Long id) {

        if (!appointmentRepository.existsById(id)) {

            throw new ResourceNotFoundException(
                    "Appointment not found"
            );
        }

        appointmentRepository.deleteById(id);
    }


    // =========================================================
    // VALIDATE DATE & TIME
    // =========================================================

    private void validateDateAndTime(
            LocalDate date,
            LocalTime time) {

        if (date == null || time == null) {

            throw new AppointmentValidationException(
                    "Appointment date and time are required"
            );
        }


        if (date.isBefore(LocalDate.now())) {

            throw new AppointmentValidationException(
                    "Appointment date cannot be in the past"
            );
        }


        if (date.isEqual(LocalDate.now())
                && time.isBefore(LocalTime.now())) {

            throw new AppointmentValidationException(
                    "Appointment time cannot be in the past"
            );
        }
    }


    // =========================================================
    // DOCTOR AVAILABILITY CHECK
    // =========================================================

    private void checkDoctorAvailability(
            Doctor doctor,
            LocalDate date,
            LocalTime time) {

        List<DoctorAvailability> availabilities =
                doctorAvailabilityRepository
                        .findByDoctorIdAndAvailableDate(
                                doctor.getId(),
                                date
                        );


        boolean available = false;


        for (DoctorAvailability availability :
                availabilities) {

            if (!time.isBefore(
                    availability.getStartTime())
                    &&
                    time.isBefore(
                            availability.getEndTime())) {

                available = true;
                break;
            }
        }


        if (!available) {

            throw new AppointmentValidationException(
                    "Doctor is not available at this date and time"
            );
        }
    }


    // =========================================================
    // DOUBLE BOOKING CHECK
    // =========================================================

    private void checkDoubleBooking(
            Doctor doctor,
            LocalDate date,
            LocalTime time,
            Long appointmentId) {

        boolean alreadyBooked;


        if (appointmentId == null) {

            alreadyBooked =
                    appointmentRepository
                            .existsByDoctorAndAppointmentDateAndAppointmentTimeAndStatusNot(
                                    doctor,
                                    date,
                                    time,
                                    AppointmentStatus.CANCELLED
                            );

        } else {

            alreadyBooked =
                    appointmentRepository
                            .existsByDoctorAndAppointmentDateAndAppointmentTimeAndStatusNotAndIdNot(
                                    doctor,
                                    date,
                                    time,
                                    AppointmentStatus.CANCELLED,
                                    appointmentId
                            );
        }


        if (alreadyBooked) {

            throw new AppointmentAlreadyBookedException(
                    "Doctor already has an appointment at this date and time"
            );
        }
    }


    // =========================================================
    // GET DOCTOR FROM APPOINTMENT
    // =========================================================

    private Doctor getDoctorFromAppointment(
            Appointment appointment) {

        if (appointment.getDoctor() == null
                || appointment.getDoctor().getId() == null) {

            throw new AppointmentValidationException(
                    "Doctor is required"
            );
        }


        return doctorRepository.findById(
                appointment.getDoctor().getId()
        ).orElseThrow(() ->
                new ResourceNotFoundException(
                        "Doctor not found"
                )
        );
    }


    // =========================================================
    // GET APPOINTMENT
    // =========================================================

    private Appointment getAppointment(Long id) {

        return appointmentRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Appointment not found"
                        )
                );
    }


    // =========================================================
    // GET LOGGED-IN USER
    // =========================================================

    private User getLoggedInUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();


        return getUserByEmail(
                authentication.getName()
        );
    }


    // =========================================================
    // GET USER BY EMAIL
    // =========================================================

    private User getUserByEmail(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"
                        )
                );
    }


    // =========================================================
    // GET LOGGED-IN DOCTOR
    // =========================================================

    private Doctor getLoggedInDoctor() {

        User user =
                getLoggedInUser();


        return doctorRepository.findByUserId(
                user.getId()
        ).orElseThrow(() ->
                new ResourceNotFoundException(
                        "Doctor profile not found"
                )
        );
    }


    // =========================================================
    // DOCTOR OWNERSHIP CHECK
    // =========================================================

    private void checkDoctorOwnership(
            Appointment appointment,
            Doctor doctor) {

        if (!appointment.getDoctor()
                .getId()
                .equals(doctor.getId())) {

            throw new RuntimeException(
                    "You can manage only your own appointments"
            );
        }
    }


    // =========================================================
    // ENTITY → DTO
    // =========================================================

    public AppointmentResponseDTO
    convertToDTO(Appointment appointment) {

        AppointmentResponseDTO dto =
                new AppointmentResponseDTO();


        dto.setId(
                appointment.getId()
        );


        dto.setAppointmentDate(
                appointment.getAppointmentDate()
                        .toString()
        );


        dto.setAppointmentTime(
                appointment.getAppointmentTime()
                        .toString()
        );


        dto.setStatus(
                appointment.getStatus()
                        .name()
        );


        dto.setPatientId(
                appointment.getPatient()
                        .getId()
        );


        dto.setPatientName(
                appointment.getPatient()
                        .getName()
        );


        dto.setDoctorId(
                appointment.getDoctor()
                        .getId()
        );


        dto.setDoctorName(
                appointment.getDoctor()
                        .getName()
        );


        dto.setSpecialization(
                appointment.getDoctor()
                        .getSpecialization()
        );


        return dto;
    }
}