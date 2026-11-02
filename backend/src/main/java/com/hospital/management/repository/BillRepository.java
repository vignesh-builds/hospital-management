package com.hospital.management.repository;

import com.hospital.management.model.Bill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BillRepository extends JpaRepository<Bill, Long> {

    List<Bill> findByPatientId(Long patientId);

    List<Bill> findByPaymentStatusOrderByGeneratedDateDesc(String paymentStatus);

    List<Bill> findAllByOrderByGeneratedDateDesc();

    boolean existsByAppointmentId(Long appointmentId);

    boolean existsByAdmissionId(Long admissionId);

    Optional<Bill> findByAdmissionId(Long admissionId);
}
