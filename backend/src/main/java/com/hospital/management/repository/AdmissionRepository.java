package com.hospital.management.repository;

import com.hospital.management.model.Admission;
import com.hospital.management.model.AdmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AdmissionRepository extends JpaRepository<Admission, Long> {

    List<Admission> findAllByOrderByAdmittedAtDesc();

    List<Admission> findByPatientIdOrderByAdmittedAtDesc(Long patientId);

    Optional<Admission> findByBedIdAndStatus(Long bedId, AdmissionStatus status);

    boolean existsByPatientIdAndStatus(Long patientId, AdmissionStatus status);

    boolean existsByBedIdAndStatus(Long bedId, AdmissionStatus status);

    boolean existsByBedId(Long bedId);
}
