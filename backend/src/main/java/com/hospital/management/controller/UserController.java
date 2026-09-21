package com.hospital.management.controller;

import com.hospital.management.model.User;
import com.hospital.management.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.hospital.management.dto.LoginRequestDTO;
import com.hospital.management.dto.LoginResponseDTO;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public User registerUser(@RequestBody User user) {
        return userService.registerUser(user);
    }

    @PostMapping("/login")
    public LoginResponseDTO loginUser(@RequestBody LoginRequestDTO loginRequest) {
        return userService.loginUser(loginRequest);
    }

    @GetMapping("/me")
    public String getCurrentUser(Authentication authentication) {
        return authentication.getName();
    }
}