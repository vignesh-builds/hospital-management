package com.hospital.management.config;

import com.hospital.management.security.JwtAuthenticationFilter;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;


@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;


    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http

            // ==============================
            // CORS
            // ==============================
            .cors(cors ->
                    cors.configurationSource(
                            corsConfigurationSource()
                    )
            )

            // ==============================
            // CSRF
            // ==============================
            .csrf(csrf ->
                    csrf.disable()
            )

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

                    // Authentication
                    .requestMatchers(
                            "/auth/**"
                    ).permitAll()

                    // OPTIONS / CORS preflight
                    .requestMatchers(
                            HttpMethod.OPTIONS,
                            "/**"
                    ).permitAll()

                    // Public endpoints
                    .requestMatchers(
                            "/",
                            "/health"
                    ).permitAll()

                    // Everything else requires JWT
                    .anyRequest().authenticated()
            )

            // ==============================
            // JWT FILTER
            // ==============================
            .addFilterBefore(
                    jwtAuthenticationFilter,
                    UsernamePasswordAuthenticationFilter.class
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
        // ALLOWED FRONTENDS
        // ------------------------------------------------------

        configuration.setAllowedOrigins(
                List.of(
                        "http://localhost:5173",
                        "http://localhost:3000",
                        "https://hospital-frontend-7jfj.onrender.com"
                )
        );


        // ------------------------------------------------------
        // METHODS
        // ------------------------------------------------------

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"
                )
        );


        // ------------------------------------------------------
        // HEADERS
        // ------------------------------------------------------

        configuration.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type",
                        "Accept",
                        "Origin",
                        "X-Requested-With"
                )
        );


        // ------------------------------------------------------
        // CREDENTIALS
        // ------------------------------------------------------

        configuration.setAllowCredentials(true);


        // ------------------------------------------------------
        // EXPOSE HEADERS
        // ------------------------------------------------------

        configuration.setExposedHeaders(
                List.of(
                        "Authorization"
                )
        );


        // ------------------------------------------------------
        // REGISTER
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
