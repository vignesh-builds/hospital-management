package com.hospital.management.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public Map<String, Object> home() {

        return Map.of(
                "status", 200,
                "message", "Hospital Management Backend is running",
                "application", "Hospital Management System"
        );
    }
}
