package com.hospital.management.controller;

import com.hospital.management.dto.AppointmentResponseDTO;
import com.hospital.management.model.Appointment;
import com.hospital.management.service.AppointmentService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;


    // =========================================================
    // CREATE
    // =========================================================

    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    @PostMapping
    public AppointmentResponseDTO createAppointment(
            @RequestBody Appointment appointment) {

        return appointmentService.createAppointment(
                appointment
        );
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @GetMapping
    public List<AppointmentResponseDTO>
    getAllAppointments() {

        return appointmentService.getAllAppointments();
    }


    // =========================================================
    // MY APPOINTMENTS
    // =========================================================

    @PreAuthorize("hasRole('PATIENT')")
    @GetMapping("/my")
    public List<AppointmentResponseDTO>
    getMyAppointments() {

        return appointmentService.getMyAppointments();
    }


    // =========================================================
    // PATIENT APPOINTMENTS
    // =========================================================

    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @GetMapping("/patient/{patientId}")
    public List<AppointmentResponseDTO>
    getAppointmentsByPatient(
            @PathVariable Long patientId) {

        return appointmentService
                .getAppointmentsByPatient(patientId);
    }


    // =========================================================
    // DOCTOR APPOINTMENTS
    // =========================================================

    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @GetMapping("/doctor")
    public List<AppointmentResponseDTO>
    getAppointmentsByDoctor() {

        return appointmentService
                .getAppointmentsByDoctor();
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @GetMapping("/{id}")
    public AppointmentResponseDTO
    getAppointmentById(
            @PathVariable Long id) {

        return appointmentService
                .getAppointmentById(id);
    }


    // =========================================================
    // UPDATE
    // =========================================================

    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @PutMapping("/{id}")
    public AppointmentResponseDTO updateAppointment(
            @PathVariable Long id,
            @RequestBody Appointment appointment) {

        return appointmentService
                .updateAppointment(id, appointment);
    }


    // =========================================================
    // CONFIRM
    // =========================================================

    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("/{id}/confirm")
    public AppointmentResponseDTO confirmAppointment(
            @PathVariable Long id) {

        return appointmentService
                .confirmAppointment(id);
    }


    // =========================================================
    // COMPLETE
    // =========================================================

    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("/{id}/complete")
    public AppointmentResponseDTO completeAppointment(
            @PathVariable Long id) {

        return appointmentService
                .completeAppointment(id);
    }


    // =========================================================
    // CANCEL
    // =========================================================

    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    @PutMapping("/{id}/cancel")
    public AppointmentResponseDTO cancelAppointment(
            @PathVariable Long id) {

        return appointmentService
                .cancelAppointment(id);
    }


    // =========================================================
    // RESCHEDULE
    // =========================================================

    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    @PutMapping("/{id}/reschedule")
    public AppointmentResponseDTO rescheduleAppointment(
            @PathVariable Long id,
            @RequestParam LocalDate newDate,
            @RequestParam LocalTime newTime) {

        return appointmentService.rescheduleAppointment(
                id,
                newDate,
                newTime
        );
    }


    // =========================================================
    // DELETE
    // =========================================================

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void deleteAppointment(
            @PathVariable Long id) {

        appointmentService.deleteAppointment(id);
    }
}