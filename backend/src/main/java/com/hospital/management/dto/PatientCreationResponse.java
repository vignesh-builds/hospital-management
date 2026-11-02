
package com.hospital.management.dto;

public class PatientCreationResponse {

    private Long patientId;
    private String name;
    private String email;
    private String temporaryPassword;
    private boolean mustChangePassword;

    public PatientCreationResponse(
            Long patientId,
            String name,
            String email,
            String temporaryPassword,
            boolean mustChangePassword) {
        this.patientId = patientId;
        this.name = name;
        this.email = email;
        this.temporaryPassword = temporaryPassword;
        this.mustChangePassword = mustChangePassword;
    }

    public Long getPatientId() {
        return patientId;
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
