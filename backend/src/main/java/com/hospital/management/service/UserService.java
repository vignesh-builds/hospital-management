package com.hospital.management.service;

import com.hospital.management.dto.LoginRequestDTO;
import com.hospital.management.dto.LoginResponseDTO;
import com.hospital.management.model.Patient;
import com.hospital.management.model.User;
import com.hospital.management.repository.PatientRepository;
import com.hospital.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private JwtService jwtService;

    private BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();


    // =========================
    // REGISTER USER
    // =========================
    public User registerUser(User user) {

        // Check email already exists
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        // Encrypt password
        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );

        // Every newly registered user is PATIENT
        user.setRole("PATIENT");

        // Save User
        User savedUser = userRepository.save(user);


        // =========================
        // CREATE PATIENT PROFILE
        // =========================

        Patient patient = new Patient();

        patient.setName(savedUser.getName());
        patient.setEmail(savedUser.getEmail());

        // Connect Patient with User
        patient.setUser(savedUser);

        // Save Patient
        patientRepository.save(patient);


        return savedUser;
    }


    // =========================
    // LOGIN USER
    // =========================
    public LoginResponseDTO loginUser(
            LoginRequestDTO loginRequest) {

        // Find user by email
        User user = userRepository
                .findByEmail(loginRequest.getEmail())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Invalid email or password"
                        )
                );


        // Check password
        if (!passwordEncoder.matches(
                loginRequest.getPassword(),
                user.getPassword())) {

            throw new RuntimeException(
                    "Invalid email or password"
            );
        }


        // Generate JWT token
        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole()
        );


        // Create login response
        LoginResponseDTO response =
                new LoginResponseDTO();

        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setToken(token);


        return response;
    }
}