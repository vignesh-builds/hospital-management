package com.hospital.management.controller;

import com.hospital.management.model.User;
import com.hospital.management.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import com.hospital.management.dto.LoginRequestDTO;
import com.hospital.management.dto.LoginResponseDTO;
import com.hospital.management.dto.RegisterRequestDTO;
import com.hospital.management.dto.ResetPasswordRequestDTO;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class UserController {

    @Autowired
    private UserService userService;

    // REGISTER
    @PostMapping("/register")
    public User registerUser(@RequestBody RegisterRequestDTO request) {
        return userService.registerUser(request);
    }

    // LOGIN
    @PostMapping("/login")
    public LoginResponseDTO loginUser(
            @RequestBody LoginRequestDTO loginRequest) {
        return userService.loginUser(loginRequest);
    }

    // 1. FORGOT PASSWORD - REQUEST OTP VIA EMAIL
    @PostMapping("/forgot-password/request")
    public ResponseEntity<?> requestPasswordReset(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        userService.sendPasswordResetEmail(email);
        return ResponseEntity.ok(Map.of(
            "message", "Verification code (OTP) sent to your email address."
        ));
    }

    // Verify OTP without changing the password; only then show password fields in the UI.
    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<?> verifyPasswordResetOtp(@RequestBody Map<String, String> payload) {
        userService.verifyPasswordResetOtp(payload.get("email"), payload.get("otp"));
        return ResponseEntity.ok(Map.of("message", "Verification code is valid."));
    }

    // 2. FORGOT PASSWORD - VERIFY OTP & RESET PASSWORD
    @PostMapping("/forgot-password/verify")
    public ResponseEntity<?> verifyAndResetPassword(@RequestBody ResetWithOtpRequest req) {
        userService.resetPasswordWithOtp(
            req.getEmail(), req.getOtp(), req.getNewPassword(), req.getConfirmPassword()
        );
        return ResponseEntity.ok(Map.of(
            "message", "Password reset successfully. You can now login with your new password."
        ));
    }

    public static class ResetWithOtpRequest {
        private String email;
        private String otp;
        private String newPassword;
        private String confirmPassword;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getOtp() { return otp; }
        public void setOtp(String otp) { this.otp = otp; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
        public String getConfirmPassword() { return confirmPassword; }
        public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
    }

    // FORGOT PASSWORD (LEGACY / DIRECT)
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @RequestBody ResetPasswordRequestDTO request) {
        userService.resetPassword(request);
        return ResponseEntity.ok("Password reset successfully");
    }

    // CREATE STAFF ACCOUNT WITH AUTOMATIC TEMPORARY PASSWORD
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/staff")
    public ResponseEntity<?> createStaff(@RequestBody StaffRequest req) {
        UserService.StaffAccountResult result = userService.createStaffAccount(req.name, req.email, req.password, req.role);
        User u = result.getUser();
        return ResponseEntity.ok(java.util.Map.of(
                "id", u.getId(),
                "name", u.getName(),
                "email", u.getEmail(),
                "role", u.getRole(),
                "temporaryPassword", result.getTemporaryPassword(),
                "mustChangePassword", u.isMustChangePassword(),
                "message", "Staff account created and temporary password sent via email."
        ));
    }

    public static class StaffRequest {
        public String name, email, password, role;
        public String getName() { return name; } public void setName(String v) { name = v; }
        public String getEmail() { return email; } public void setEmail(String v) { email = v; }
        public String getPassword() { return password; } public void setPassword(String v) { password = v; }
        public String getRole() { return role; } public void setRole(String v) { role = v; }
    }

    // CURRENT USER
    @GetMapping("/me")
    public String getCurrentUser(Authentication authentication) {
        return authentication.getName();
    }

    // CHANGE PASSWORD
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody ChangePasswordRequest request,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401)
                    .body("Please log in first");
        }

        userService.changePassword(
                authentication.getName(),
                request.getOldPassword(),
                request.getNewPassword(),
                request.getConfirmPassword()
        );

        return ResponseEntity.ok("Password changed successfully");
    }

    // REQUEST DTO
    public static class ChangePasswordRequest {

        private String oldPassword;
        private String newPassword;
        private String confirmPassword;

        public String getOldPassword() {
            return oldPassword;
        }

        public void setOldPassword(String oldPassword) {
            this.oldPassword = oldPassword;
        }

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }

        public String getConfirmPassword() {
            return confirmPassword;
        }

        public void setConfirmPassword(String confirmPassword) {
            this.confirmPassword = confirmPassword;
        }
    }
}
