package com.hospital.management.service;

import com.hospital.management.dto.LoginRequestDTO;
import com.hospital.management.dto.LoginResponseDTO;
import com.hospital.management.dto.RegisterRequestDTO;
import com.hospital.management.exception.BadRequestException;
import com.hospital.management.model.Patient;
import com.hospital.management.model.User;
import com.hospital.management.repository.PatientRepository;
import com.hospital.management.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private static final String EMAIL_PATTERN = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;


    // =========================
    // REGISTER USER (always PATIENT)
    // =========================
    @Transactional
    public User registerUser(RegisterRequestDTO request) {

        if (request == null
                || isBlank(request.getName())
                || isBlank(request.getEmail())
                || isBlank(request.getPassword())) {

            throw new BadRequestException(
                    "Name, email and password are required");
        }

        String email = request.getEmail().trim().toLowerCase();

        if (!email.matches(EMAIL_PATTERN)) {
            throw new BadRequestException("Please enter a valid email");
        }

        if (request.getPassword().length() < 6) {
            throw new BadRequestException(
                    "Password must be at least 6 characters");
        }

        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new BadRequestException("Email already registered");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("PATIENT");

        User savedUser = userRepository.save(user);

        Patient patient = new Patient();
        patient.setName(savedUser.getName());
        patient.setEmail(savedUser.getEmail());
        patient.setUser(savedUser);
        patientRepository.save(patient);

        return savedUser;
    }


    // =========================
    // LOGIN USER
    // =========================
    public LoginResponseDTO loginUser(LoginRequestDTO loginRequest) {

        if (loginRequest == null
                || isBlank(loginRequest.getEmail())
                || isBlank(loginRequest.getPassword())) {

            throw new BadRequestException("Invalid email or password");
        }

        User user = userRepository
                .findByEmailIgnoreCase(loginRequest.getEmail().trim())
                .orElseThrow(() ->
                        new BadRequestException("Invalid email or password"));

        if (!passwordEncoder.matches(
                loginRequest.getPassword(), user.getPassword())) {

            throw new BadRequestException("Invalid email or password");
        }

        String token = jwtService.generateToken(
                user.getEmail(), user.getRole());

        LoginResponseDTO response = new LoginResponseDTO();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setToken(token);

        return response;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
