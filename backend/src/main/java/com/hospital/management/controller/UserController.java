
package com.hospital.management.controller;

import com.hospital.management.model.User;
import com.hospital.management.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.hospital.management.dto.LoginRequestDTO;
import com.hospital.management.dto.LoginResponseDTO;
import com.hospital.management.dto.RegisterRequestDTO;

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
