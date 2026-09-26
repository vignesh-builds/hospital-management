package com.hospital.management.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {

        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http

                // Disable CSRF for REST API
                .csrf(csrf -> csrf.disable())

                // Enable CORS
                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )

                // JWT based authentication
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // Authorization rules
                .authorizeHttpRequests(auth -> auth

                        // Root endpoint
                        .requestMatchers("/")
                        .permitAll()

                        // Authentication endpoints
                        .requestMatchers(
                                "/auth/register",
                                "/auth/login"
                        )
                        .permitAll()

                        // Authenticated user information
                        .requestMatchers(
                                "/auth/me"
                        )
                        .authenticated()

                        // Patient APIs
                        .requestMatchers(
                                "/patients/**"
                        )
                        .hasAnyRole(
                                "PATIENT",
                                "ADMIN"
                        )

                        // Doctor APIs
                        .requestMatchers(
                                "/doctors/**"
                        )
                        .hasAnyRole(
                                "PATIENT",
                                "DOCTOR",
                                "ADMIN"
                        )

                        // Appointment APIs
                        .requestMatchers(
                                "/appointments/**"
                        )
                        .hasAnyRole(
                                "PATIENT",
                                "DOCTOR",
                                "ADMIN"
                        )

                        // Availability APIs
                        .requestMatchers(
                                "/availability/**"
                        )
                        .hasAnyRole(
                                "PATIENT",
                                "DOCTOR",
                                "ADMIN"
                        )

                        // Everything else requires authentication
                        .anyRequest()
                        .authenticated()
                )

                // JWT filter
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                Arrays.asList(frontendUrl)
        );

        configuration.setAllowedMethods(
                Arrays.asList(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                Arrays.asList(
                        "Authorization",
                        "Content-Type",
                        "Accept"
                )
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}
