package com.hospital.management.dto;

public record AdmitRequest(Long patientId, Long bedId, String reason) {}
