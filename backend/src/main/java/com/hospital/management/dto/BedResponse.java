package com.hospital.management.dto;
public record BedResponse(Long id,String bedNumber,String wardType,boolean occupied,Double dailyRate,
 Long admissionId,Long patientId,String patientName,String admittedAt,String status,
 String reservedPatientName,String reservedUntil) {}
