package com.hospital.management.repository;

import com.hospital.management.model.Appointment;
import com.hospital.management.model.AppointmentStatus;
import com.hospital.management.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface AppointmentRepository
        extends JpaRepository<Appointment, Long> {

    boolean existsByDoctorAndAppointmentDateAndAppointmentTimeAndStatusNot(
            Doctor doctor,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            AppointmentStatus status
    );

    boolean existsByDoctorAndAppointmentDateAndAppointmentTimeAndStatusNotAndIdNot(
            Doctor doctor,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            AppointmentStatus status,
            Long id
    );

    List<Appointment> findByPatientId(Long patientId);

    List<Appointment> findByDoctorId(Long doctorId);

    List<Appointment> findByDoctorIdAndAppointmentDate(
            Long doctorId,
            LocalDate appointmentDate
    );
}