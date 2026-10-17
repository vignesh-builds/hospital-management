package com.hospital.management.repository;

import com.hospital.management.model.DoctorAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface DoctorAvailabilityRepository
        extends JpaRepository<DoctorAvailability, Long> {

    List<DoctorAvailability> findByDoctorId(Long doctorId);

    List<DoctorAvailability> findByDoctorIdAndAvailableDate(
            Long doctorId,
            LocalDate availableDate
    );

    boolean existsByDoctorIdAndAvailableDateAndStartTimeLessThanAndEndTimeGreaterThan(
            Long doctorId,
            LocalDate availableDate,
            LocalTime appointmentTime1,
            LocalTime appointmentTime2
    );
}