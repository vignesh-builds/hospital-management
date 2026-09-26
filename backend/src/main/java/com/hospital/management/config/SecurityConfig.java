package com.hospital.management.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.web.SecurityFilterChain;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;


@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http

            // ==============================
            // CORS
            // ==============================
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // ==============================
            // CSRF
            // ==============================
            .csrf(csrf -> csrf.disable())

            // ==============================
            // SESSION
            // ==============================
            .sessionManagement(session ->
                    session.sessionCreationPolicy(
                            SessionCreationPolicy.STATELESS
                    )
            )

            // ==============================
            // AUTHORIZATION
            // ==============================
            .authorizeHttpRequests(auth -> auth

                    // Authentication APIs
                    .requestMatchers(
                            "/auth/**"
                    ).permitAll()

                    // OPTIONS preflight request
                    .requestMatchers(
                            org.springframework.http.HttpMethod.OPTIONS,
                            "/**"
                    ).permitAll()

                    // Public health/test API
                    .requestMatchers(
                            "/",
                            "/health",
                            "/api/**"
                    ).permitAll()

                    // Everything else requires login
                    .anyRequest().authenticated()
            );

        return http.build();
    }


    // ==========================================================
    // CORS CONFIGURATION
    // ==========================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        // ------------------------------------------------------
        // FRONTEND URLS
        // ------------------------------------------------------

        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:3000",

                // IMPORTANT:
                // Replace this with your actual Render frontend URL
                "https://hospital-frontend-7jfj.onrender.com"
        ));


        // ------------------------------------------------------
        // ALLOWED METHODS
        // ------------------------------------------------------

        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "PATCH",
                "OPTIONS"
        ));


        // ------------------------------------------------------
        // ALLOWED HEADERS
        // ------------------------------------------------------

        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With"
        ));


        // ------------------------------------------------------
        // CREDENTIALS
        // ------------------------------------------------------

        configuration.setAllowCredentials(true);


        // ------------------------------------------------------
        // EXPOSE HEADERS
        // ------------------------------------------------------

        configuration.setExposedHeaders(List.of(
                "Authorization"
        ));


        // ------------------------------------------------------
        // REGISTER CORS CONFIGURATION
        // ------------------------------------------------------

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );


        return source;
    }
}
