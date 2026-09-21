package com.hospital.management.service;

import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.model.Doctor;
import com.hospital.management.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DoctorService {

    @Autowired
    private DoctorRepository doctorRepository;

    public Doctor createDoctor(Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    public Doctor getDoctorById(Long id) {
        return doctorRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Doctor not found"));
    }

    public Doctor updateDoctor(Long id, Doctor doctor) {

        Doctor existingDoctor = doctorRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Doctor not found"));

        existingDoctor.setName(doctor.getName());
        existingDoctor.setSpecialization(doctor.getSpecialization());
        existingDoctor.setPhone(doctor.getPhone());

        return doctorRepository.save(existingDoctor);
    }

    public void deleteDoctor(Long id) {

        if (!doctorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Doctor not found");
        }

        doctorRepository.deleteById(id);
    }
}