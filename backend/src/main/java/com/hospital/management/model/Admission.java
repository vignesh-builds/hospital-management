package com.hospital.management.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** One inpatient stay: patient in a bed from admittedAt until dischargedAt. */
@Entity
@Table(name = "admissions")
public class Admission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(optional = false)
    @JoinColumn(name = "bed_id", nullable = false)
    private Bed bed;

    private String reason;

    /** Daily rate copied from the bed at admission time (rates may change later). */
    private Double dailyRate = 0.0;

    private LocalDateTime admittedAt = LocalDateTime.now();

    private LocalDateTime dischargedAt;

    private Integer billedDays;

    private Double roomCharges;

    @Enumerated(EnumType.STRING)
    private AdmissionStatus status = AdmissionStatus.ADMITTED;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }
    public Bed getBed() { return bed; }
    public void setBed(Bed bed) { this.bed = bed; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public Double getDailyRate() { return dailyRate; }
    public void setDailyRate(Double dailyRate) { this.dailyRate = dailyRate; }
    public LocalDateTime getAdmittedAt() { return admittedAt; }
    public void setAdmittedAt(LocalDateTime admittedAt) { this.admittedAt = admittedAt; }
    public LocalDateTime getDischargedAt() { return dischargedAt; }
    public void setDischargedAt(LocalDateTime dischargedAt) { this.dischargedAt = dischargedAt; }
    public Integer getBilledDays() { return billedDays; }
    public void setBilledDays(Integer billedDays) { this.billedDays = billedDays; }
    public Double getRoomCharges() { return roomCharges; }
    public void setRoomCharges(Double roomCharges) { this.roomCharges = roomCharges; }
    public AdmissionStatus getStatus() { return status; }
    public void setStatus(AdmissionStatus status) { this.status = status; }
}
