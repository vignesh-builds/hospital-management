package com.hospital.management.model;

import jakarta.persistence.*;

@Entity
@Table(name = "beds")
public class Bed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String bedNumber;

    private String wardType;
    private boolean occupied = false;
    @Column(nullable = true)
    private String status = "AVAILABLE";
    @ManyToOne
    @JoinColumn(name = "reserved_patient_id")
    private Patient reservedPatient;
    private java.time.LocalDateTime reservedUntil;
    private Double dailyRate = 0.0;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getBedNumber() { return bedNumber; }
    public void setBedNumber(String bedNumber) { this.bedNumber = bedNumber; }
    public String getWardType() { return wardType; }
    public void setWardType(String wardType) { this.wardType = wardType; }
    public boolean isOccupied() { return occupied; }
    public void setOccupied(boolean occupied) { this.occupied = occupied; }
    public Double getDailyRate() { return dailyRate; }
    public void setDailyRate(Double dailyRate) { this.dailyRate = dailyRate; }
    public String getStatus() { return status; }
    public void setStatus(String v) { status=v; }
    public Patient getReservedPatient() { return reservedPatient; }
    public void setReservedPatient(Patient v) { reservedPatient=v; }
    public java.time.LocalDateTime getReservedUntil() { return reservedUntil; }
    public void setReservedUntil(java.time.LocalDateTime v) { reservedUntil=v; }
    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }
}
