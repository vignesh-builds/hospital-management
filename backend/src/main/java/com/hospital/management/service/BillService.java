package com.hospital.management.service;

import com.hospital.management.exception.BadRequestException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.model.Admission;
import com.hospital.management.model.Appointment;
import com.hospital.management.model.AppointmentStatus;
import com.hospital.management.model.Bill;
import com.hospital.management.model.Patient;
import com.hospital.management.repository.AppointmentRepository;
import com.hospital.management.repository.BillRepository;
import com.hospital.management.repository.PatientRepository;
import com.hospital.management.repository.PrescriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BillService {

    public static final String PENDING = "PENDING";
    public static final String PAID = "PAID";

    private final BillRepository billRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AccessGuard accessGuard;

    public BillService(BillRepository billRepository,
                       PatientRepository patientRepository,
                       AppointmentRepository appointmentRepository,
                       PrescriptionRepository prescriptionRepository,
                       AccessGuard accessGuard) {
        this.billRepository = billRepository;
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.accessGuard = accessGuard;
    }

    // ---------------------------------------------------------
    // Manual bill (admin types the amounts)
    // ---------------------------------------------------------
    @Transactional
    public Bill createManual(Bill input) {
        if (input == null || input.getPatient() == null
                || input.getPatient().getId() == null) {
            throw new BadRequestException("Patient is required");
        }
        Patient patient = patientRepository.findById(input.getPatient().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        Bill bill = new Bill();
        bill.setPatient(patient);
        bill.setDoctorFee(nonNegative(input.getDoctorFee(), "Doctor fee"));
        bill.setRoomCharges(nonNegative(input.getRoomCharges(), "Room charges"));
        bill.setMedicineCharges(nonNegative(input.getMedicineCharges(), "Medicine charges"));
        bill.setDescription(input.getDescription());
        applyTotal(bill);
        return billRepository.save(bill);
    }

    // ---------------------------------------------------------
    // Auto bill: completed appointment -> consultation fee + prescription medicines
    // ---------------------------------------------------------
    @Transactional
    public Bill createFromAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new BadRequestException(
                    "A bill can be generated only for a COMPLETED appointment");
        }
        if (billRepository.existsByAppointmentId(appointmentId)) {
            throw new BadRequestException("A bill already exists for this appointment");
        }

        double doctorFee = appointment.getDoctor() == null
                || appointment.getDoctor().getConsultationFee() == null
                ? 0.0 : appointment.getDoctor().getConsultationFee();

        double medicines = prescriptionRepository.findByAppointmentId(appointmentId)
                .map(p -> p.getMedicineCharges() == null ? 0.0 : p.getMedicineCharges())
                .orElse(0.0);

        Bill bill = new Bill();
        bill.setPatient(appointment.getPatient());
        bill.setAppointmentId(appointmentId);
        bill.setDoctorFee(doctorFee);
        bill.setMedicineCharges(medicines);
        bill.setRoomCharges(0.0);
        bill.setDescription("Consultation on " + appointment.getAppointmentDate()
                + (appointment.getDoctor() == null ? ""
                : " with Dr. " + appointment.getDoctor().getName()));
        applyTotal(bill);
        return billRepository.save(bill);
    }

    // ---------------------------------------------------------
    // Auto bill: discharged admission -> room charges
    // ---------------------------------------------------------
    @Transactional
    public Bill createForAdmission(Admission admission) {
        if (billRepository.existsByAdmissionId(admission.getId())) {
            throw new BadRequestException("A bill already exists for this admission");
        }
        Bill bill = new Bill();
        bill.setPatient(admission.getPatient());
        bill.setAdmissionId(admission.getId());
        bill.setDoctorFee(0.0);
        bill.setMedicineCharges(0.0);
        bill.setRoomCharges(admission.getRoomCharges() == null ? 0.0 : admission.getRoomCharges());
        bill.setDescription("Inpatient stay in bed " + admission.getBed().getBedNumber()
                + " (" + admission.getBilledDays() + " day(s) x Rs. "
                + admission.getDailyRate() + ")");
        applyTotal(bill);
        return billRepository.save(bill);
    }

    // ---------------------------------------------------------
    // Reads (ownership enforced)
    // ---------------------------------------------------------
    @Transactional(readOnly = true)
    public List<Bill> getForPatient(Long patientId) {
        accessGuard.checkBillingAccess(patientId);
        return billRepository.findByPatientId(patientId);
    }

    @Transactional(readOnly = true)
    public List<Bill> getMine() {
        return billRepository.findByPatientId(accessGuard.currentPatient().getId());
    }

    @Transactional(readOnly = true)
    public Bill getById(Long id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found"));
        accessGuard.checkBillingAccess(bill.getPatient().getId());
        return bill;
    }

    @Transactional(readOnly = true)
    public List<Bill> getAll(String status) {
        if (status == null || status.isBlank()) {
            return billRepository.findAllByOrderByGeneratedDateDesc();
        }
        String normalized = status.trim().toUpperCase();
        if (!PENDING.equals(normalized) && !PAID.equals(normalized)) {
            throw new BadRequestException("Status must be PENDING or PAID");
        }
        return billRepository.findByPaymentStatusOrderByGeneratedDateDesc(normalized);
    }

    @Transactional
    public Bill markPaid(Long id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found"));
        if (PAID.equals(bill.getPaymentStatus())) {
            throw new BadRequestException("This bill is already paid");
        }
        bill.setPaymentStatus(PAID);
        bill.setPaidDate(LocalDateTime.now());
        return billRepository.save(bill);
    }

    // ---------------------------------------------------------
    // helpers
    // ---------------------------------------------------------
    static void applyTotal(Bill bill) {
        double total = bill.getDoctorFee() + bill.getRoomCharges() + bill.getMedicineCharges();
        bill.setTotalAmount(Math.round(total * 100.0) / 100.0);
        bill.setPaymentStatus(PENDING);
    }

    private static double nonNegative(Double value, String label) {
        double v = value == null ? 0.0 : value;
        if (v < 0 || Double.isNaN(v) || Double.isInfinite(v)) {
            throw new BadRequestException(label + " must be zero or more");
        }
        return v;
    }
}
