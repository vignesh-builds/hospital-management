package com.hospital.management.service;

import com.hospital.management.dto.LoginRequestDTO;
import com.hospital.management.dto.LoginResponseDTO;
import com.hospital.management.dto.RegisterRequestDTO;
import com.hospital.management.dto.ResetPasswordRequestDTO;
import com.hospital.management.exception.BadRequestException;
import com.hospital.management.model.Patient;
import com.hospital.management.model.User;
import com.hospital.management.repository.DoctorRepository;
import com.hospital.management.repository.PatientRepository;
import com.hospital.management.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class UserService {

    private static final String EMAIL_PATTERN =
            "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String TEMP_PASSWORD_CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    // REGISTER PATIENT
    @Transactional
    public User registerUser(RegisterRequestDTO request) {

        if (request == null
                || isBlank(request.getName())
                || isBlank(request.getEmail())
                || isBlank(request.getPhone())
                || isBlank(request.getPassword())
                || request.getAge() == null) {
            throw new BadRequestException(
                    "Name, email, phone, age and password are required");
        }

        String name = request.getName().trim();
        String email = request.getEmail().trim().toLowerCase();
        String phone = request.getPhone().trim();
        String password = request.getPassword();
        Integer age = request.getAge();

        if (!email.matches(EMAIL_PATTERN)) {
            throw new BadRequestException("Please enter a valid email");
        }

        if (!phone.matches("\\d{10}")) {
            throw new BadRequestException(
                    "Phone number must contain exactly 10 digits");
        }

        if (age < 0 || age > 150) {
            throw new BadRequestException(
                    "Age must be between 0 and 150");
        }

        if (password.length() < 6) {
            throw new BadRequestException(
                    "Password must be at least 6 characters");
        }

        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new BadRequestException("Email already registered");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("PATIENT");
        user.setMustChangePassword(false);

        User savedUser = userRepository.save(user);

        Patient patient = new Patient();
        patient.setName(name);
        patient.setEmail(email);
        patient.setPhone(phone);
        patient.setAge(age);
        patient.setUser(savedUser);

        patientRepository.save(patient);

        return savedUser;
    }

    /**
     * Creates a staff account (Receptionist, Nurse, Ward In-charge) with an AUTOMATIC temporary password.
     * The temporary password is sent to their email and returned to the admin.
     */
    @Transactional
    public StaffAccountResult createStaffAccount(String name, String email, String providedPassword, String role) {
        String r = role == null ? "" : role.trim().toUpperCase();
        if (!java.util.Set.of("RECEPTIONIST", "NURSE", "WARD_IN_CHARGE").contains(r)) {
            throw new BadRequestException("Invalid staff role. Must be RECEPTIONIST, NURSE, or WARD_IN_CHARGE");
        }
        if (isBlank(name) || isBlank(email)) {
            throw new BadRequestException("Name and email are required");
        }
        String e = email.trim().toLowerCase();
        if (!e.matches(EMAIL_PATTERN)) {
            throw new BadRequestException("Please enter a valid email");
        }
        if (userRepository.findByEmailIgnoreCase(e).isPresent()) {
            throw new BadRequestException("Email already registered");
        }

        // Generate automatic secure temporary password if not provided or empty
        String temporaryPassword = (providedPassword != null && providedPassword.trim().length() >= 8)
                ? providedPassword.trim()
                : generateTemporaryPassword();

        User u = new User();
        u.setName(name.trim());
        u.setEmail(e);
        u.setPassword(passwordEncoder.encode(temporaryPassword));
        u.setRole(r);
        u.setMustChangePassword(true);

        User saved = userRepository.save(u);

        // Send welcome email with temporary password
        emailService.sendStaffWelcomeEmail(e, name.trim(), r, temporaryPassword);

        return new StaffAccountResult(saved, temporaryPassword);
    }

    public static class StaffAccountResult {
        private final User user;
        private final String temporaryPassword;

        public StaffAccountResult(User user, String temporaryPassword) {
            this.user = user;
            this.temporaryPassword = temporaryPassword;
        }

        public User getUser() {
            return user;
        }

        public String getTemporaryPassword() {
            return temporaryPassword;
        }
    }

    // LOGIN USER
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
        response.setMustChangePassword(user.isMustChangePassword());

        return response;
    }

    // CHANGE PASSWORD
    @Transactional
    public void changePassword(
            String email,
            String oldPassword,
            String newPassword,
            String confirmPassword) {

        if (isBlank(email)
                || isBlank(oldPassword)
                || isBlank(newPassword)
                || isBlank(confirmPassword)) {
            throw new BadRequestException(
                    "All password fields are required");
        }

        if (!newPassword.equals(confirmPassword)) {
            throw new BadRequestException(
                    "New password and confirm password do not match");
        }

        if (newPassword.length() < 6) {
            throw new BadRequestException(
                    "New password must be at least 6 characters");
        }

        if (oldPassword.equals(newPassword)) {
            throw new BadRequestException(
                    "New password must be different from old password");
        }

        User user = userRepository
                .findByEmailIgnoreCase(email.trim())
                .orElseThrow(() ->
                        new BadRequestException("User account not found"));

        if (!passwordEncoder.matches(
                oldPassword, user.getPassword())) {
            throw new BadRequestException("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);

        userRepository.save(user);
    }

    // 1. FORGOT PASSWORD - SEND OTP TO EMAIL
    @Transactional
    public void sendPasswordResetEmail(String email) {
        if (isBlank(email)) {
            throw new BadRequestException("Email is required");
        }

        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("No account found with this email address"));

        // Generate 6-digit random numeric OTP
        int code = 100000 + SECURE_RANDOM.nextInt(900000);
        String otp = String.valueOf(code);

        user.setResetOtp(otp);
        user.setResetOtpExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        emailService.sendPasswordResetOtpEmail(user.getEmail(), user.getName(), otp);
    }

    // Verify OTP independently before allowing the UI to show password fields.
    @Transactional(readOnly = true)
    public void verifyPasswordResetOtp(String email, String otp) {
        if (isBlank(email) || isBlank(otp)) {
            throw new BadRequestException("Email and verification code are required");
        }
        User user = userRepository.findByEmailIgnoreCase(email.trim().toLowerCase())
                .orElseThrow(() -> new BadRequestException("User account not found"));
        if (user.getResetOtp() == null || user.getResetOtpExpiry() == null) {
            throw new BadRequestException("No active password reset request found. Please request a new code.");
        }
        if (user.getResetOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Verification code has expired. Please request a new one.");
        }
        if (!user.getResetOtp().trim().equals(otp.trim())) {
            throw new BadRequestException("Invalid verification code. Please check your email.");
        }
    }

    // 2. FORGOT PASSWORD - RESET USING OTP
    @Transactional
    public void resetPasswordWithOtp(String email, String otp, String newPassword, String confirmPassword) {
        if (isBlank(email) || isBlank(otp) || isBlank(newPassword) || isBlank(confirmPassword)) {
            throw new BadRequestException("All fields are required");
        }

        if (!newPassword.equals(confirmPassword)) {
            throw new BadRequestException("New password and confirm password do not match");
        }

        if (newPassword.length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters");
        }

        User user = userRepository.findByEmailIgnoreCase(email.trim().toLowerCase())
                .orElseThrow(() -> new BadRequestException("User account not found"));

        if (user.getResetOtp() == null || user.getResetOtpExpiry() == null) {
            throw new BadRequestException("No active password reset request found. Please request a new code.");
        }

        if (user.getResetOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Verification code has expired. Please request a new one.");
        }

        if (!user.getResetOtp().trim().equals(otp.trim())) {
            throw new BadRequestException("Invalid verification code. Please check your email.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        user.setResetOtp(null);
        user.setResetOtpExpiry(null);
        userRepository.save(user);
    }

    // FORGOT PASSWORD (legacy verification via email + registered phone, kept for backwards compatibility)
    @Transactional
    public void resetPassword(ResetPasswordRequestDTO request) {

        if (request == null
                || isBlank(request.getEmail())
                || isBlank(request.getNewPassword())
                || isBlank(request.getConfirmPassword())) {
            throw new BadRequestException("All fields are required");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException(
                    "New password and confirm password do not match");
        }

        if (request.getNewPassword().length() < 6) {
            throw new BadRequestException(
                    "New password must be at least 6 characters");
        }

        final String mismatch =
                "Email and phone number do not match our records";

        User user = userRepository
                .findByEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> new BadRequestException(mismatch));

        // If phone is provided, verify phone match
        if (!isBlank(request.getPhone())) {
            String registeredPhone = null;

            if ("PATIENT".equalsIgnoreCase(user.getRole())) {
                registeredPhone = patientRepository.findByUserId(user.getId())
                        .map(Patient::getPhone)
                        .orElse(null);
            } else if ("DOCTOR".equalsIgnoreCase(user.getRole())) {
                registeredPhone = doctorRepository.findByUserId(user.getId())
                        .map(d -> d.getPhone())
                        .orElse(null);
            }

            if (registeredPhone == null
                    || !registeredPhone.trim().equals(request.getPhone().trim())) {
                throw new BadRequestException(mismatch);
            }
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    private String generateTemporaryPassword() {
        int length = 10;
        StringBuilder password = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            password.append(TEMP_PASSWORD_CHARS.charAt(
                    SECURE_RANDOM.nextInt(TEMP_PASSWORD_CHARS.length())));
        }
        return password.toString();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
