package com.hospital.management.service;

import com.hospital.management.exception.BadRequestException;
import com.hospital.management.model.Appointment;
import com.hospital.management.model.AppointmentStatus;
import com.hospital.management.model.Bill;
import com.hospital.management.model.Doctor;
import com.hospital.management.model.Patient;
import com.hospital.management.model.Prescription;
import com.hospital.management.repository.AppointmentRepository;
import com.hospital.management.repository.BillRepository;
import com.hospital.management.repository.PatientRepository;
import com.hospital.management.repository.PrescriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BillServiceTest {

    @Mock BillRepository billRepository;
    @Mock PatientRepository patientRepository;
    @Mock AppointmentRepository appointmentRepository;
    @Mock PrescriptionRepository prescriptionRepository;
    @Mock AccessGuard accessGuard;

    BillService service;

    @BeforeEach
    void setUp() {
        service = new BillService(billRepository, patientRepository,
                appointmentRepository, prescriptionRepository, accessGuard);
    }

    private Appointment appointment(AppointmentStatus status) {
        Patient patient = new Patient();
        patient.setId(1L);
        Doctor doctor = new Doctor();
        doctor.setId(2L);
        doctor.setName("Meena");
        doctor.setConsultationFee(600.0);

        Appointment a = new Appointment();
        a.setId(9L);
        a.setPatient(patient);
        a.setDoctor(doctor);
        a.setStatus(status);
        a.setAppointmentDate(LocalDate.of(2026, 11, 2));
        return a;
    }

    @Test
    void billFromCompletedAppointmentUsesDoctorFeeAndPrescriptionMedicines() {
        when(appointmentRepository.findById(9L))
                .thenReturn(Optional.of(appointment(AppointmentStatus.COMPLETED)));
        when(billRepository.existsByAppointmentId(9L)).thenReturn(false);
        Prescription prescription = new Prescription();
        prescription.setMedicineCharges(250.5);
        when(prescriptionRepository.findByAppointmentId(9L)).thenReturn(Optional.of(prescription));
        when(billRepository.save(any(Bill.class))).thenAnswer(i -> i.getArgument(0));

        Bill bill = service.createFromAppointment(9L);

        assertThat(bill.getDoctorFee()).isEqualTo(600.0);
        assertThat(bill.getMedicineCharges()).isEqualTo(250.5);
        assertThat(bill.getTotalAmount()).isEqualTo(850.5);
        assertThat(bill.getPaymentStatus()).isEqualTo("PENDING");
        assertThat(bill.getAppointmentId()).isEqualTo(9L);
    }

    @Test
    void billWithoutPrescriptionHasZeroMedicines() {
        when(appointmentRepository.findById(9L))
                .thenReturn(Optional.of(appointment(AppointmentStatus.COMPLETED)));
        when(billRepository.existsByAppointmentId(9L)).thenReturn(false);
        when(prescriptionRepository.findByAppointmentId(9L)).thenReturn(Optional.empty());
        when(billRepository.save(any(Bill.class))).thenAnswer(i -> i.getArgument(0));

        Bill bill = service.createFromAppointment(9L);

        assertThat(bill.getMedicineCharges()).isZero();
        assertThat(bill.getTotalAmount()).isEqualTo(600.0);
    }

    @Test
    void billIsRejectedForNonCompletedAppointment() {
        when(appointmentRepository.findById(9L))
                .thenReturn(Optional.of(appointment(AppointmentStatus.CONFIRMED)));

        assertThatThrownBy(() -> service.createFromAppointment(9L))
                .isInstanceOf(BadRequestException.class);
        verify(billRepository, never()).save(any());
    }

    @Test
    void duplicateBillForSameAppointmentIsRejected() {
        when(appointmentRepository.findById(9L))
                .thenReturn(Optional.of(appointment(AppointmentStatus.COMPLETED)));
        when(billRepository.existsByAppointmentId(9L)).thenReturn(true);

        assertThatThrownBy(() -> service.createFromAppointment(9L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void manualBillRejectsNegativeAmountsAndIgnoresClientTotal() {
        Patient patient = new Patient();
        patient.setId(1L);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));

        Bill negative = new Bill();
        negative.setPatient(patient);
        negative.setDoctorFee(-5.0);
        assertThatThrownBy(() -> service.createManual(negative))
                .isInstanceOf(BadRequestException.class);

        Bill tampered = new Bill();
        tampered.setPatient(patient);
        tampered.setDoctorFee(100.0);
        tampered.setRoomCharges(50.0);
        tampered.setTotalAmount(1.0);          // client lies about the total
        tampered.setPaymentStatus("PAID");     // and about the status
        when(billRepository.save(any(Bill.class))).thenAnswer(i -> i.getArgument(0));

        Bill saved = service.createManual(tampered);

        assertThat(saved.getTotalAmount()).isEqualTo(150.0);
        assertThat(saved.getPaymentStatus()).isEqualTo("PENDING");
    }

    @Test
    void markPaidSetsDateAndRejectsSecondPayment() {
        Bill bill = new Bill();
        bill.setId(3L);
        when(billRepository.findById(3L)).thenReturn(Optional.of(bill));
        when(billRepository.save(any(Bill.class))).thenAnswer(i -> i.getArgument(0));

        Bill paid = service.markPaid(3L);
        assertThat(paid.getPaymentStatus()).isEqualTo("PAID");
        assertThat(paid.getPaidDate()).isNotNull();

        assertThatThrownBy(() -> service.markPaid(3L))
                .isInstanceOf(BadRequestException.class);
    }
}
