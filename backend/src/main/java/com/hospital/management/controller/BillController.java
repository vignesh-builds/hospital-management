package com.hospital.management.controller;

import com.hospital.management.model.Bill;
import com.hospital.management.service.BillService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bills")
public class BillController {

    private final BillService billService;

    public BillController(BillService billService) {
        this.billService = billService;
    }

    /** Manual bill. Patient is set from patient.id; totals are always computed server-side. */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public Bill generateBill(@RequestBody Bill bill) {
        return billService.createManual(bill);
    }

    /** Auto bill from a COMPLETED appointment (consultation fee + prescription medicines). */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/from-appointment/{appointmentId}")
    public Bill generateFromAppointment(@PathVariable Long appointmentId) {
        return billService.createFromAppointment(appointmentId);
    }

    /** All bills, optionally filtered: /bills?status=PENDING or PAID */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<Bill> getAll(@RequestParam(required = false) String status) {
        return billService.getAll(status);
    }

    @PreAuthorize("hasRole('PATIENT')")
    @GetMapping("/my")
    public List<Bill> getMine() {
        return billService.getMine();
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    @GetMapping("/patient/{patientId}")
    public List<Bill> getPatientBills(@PathVariable Long patientId) {
        return billService.getForPatient(patientId);
    }

    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    @GetMapping("/{id}")
    public Bill getBill(@PathVariable Long id) {
        return billService.getById(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/pay")
    public Bill markAsPaid(@PathVariable Long id) {
        return billService.markPaid(id);
    }
}
