package com.hospital.management.dto;

public class DoctorCreationResponse {

    private Long doctorId;
    private String name;
    private String email;
    private String temporaryPassword;
    private boolean mustChangePassword;

    public DoctorCreationResponse(
            Long doctorId,
            String name,
            String email,
            String temporaryPassword,
            boolean mustChangePassword) {
        this.doctorId = doctorId;
        this.name = name;
        this.email = email;
        this.temporaryPassword = temporaryPassword;
        this.mustChangePassword = mustChangePassword;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getTemporaryPassword() {
        return temporaryPassword;
    }

    public boolean isMustChangePassword() {
        return mustChangePassword;
    }
}
