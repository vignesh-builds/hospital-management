package com.hospital.management.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
            HttpSecurity http) throws Exception {

        http

                // ==================================================
                // CORS
                // ==================================================

                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )

                // ==================================================
                // CSRF
                // ==================================================

                .csrf(csrf -> csrf.disable())

                // ==================================================
                // SESSION
                // ==================================================

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // ==================================================
                // AUTHORIZATION
                // ==================================================

                .authorizeHttpRequests(auth -> auth

                        // ------------------------------------------------
                        // CORS PREFLIGHT
                        // ------------------------------------------------

                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()


                        // ------------------------------------------------
                        // AUTHENTICATION
                        // ------------------------------------------------

                        .requestMatchers(
                                "/auth/**"
                        ).permitAll()


                        // ------------------------------------------------
                        // PUBLIC HOME / HEALTH
                        // ------------------------------------------------

                        .requestMatchers(
                                "/",
                                "/health"
                        ).permitAll()


                        // ------------------------------------------------
                        // PUBLIC DOCTOR APIs
                        // ------------------------------------------------

                        .requestMatchers(
                                HttpMethod.GET,
                                "/doctors",
                                "/doctors/**"
                        ).permitAll()


                        // ------------------------------------------------
                        // PUBLIC API
                        // ------------------------------------------------

                        .requestMatchers(
                                "/api/**"
                        ).permitAll()


                        // ------------------------------------------------
                        // EVERYTHING ELSE
                        // ------------------------------------------------

                        .anyRequest().authenticated()
                );

        return http.build();
    }


    // ==============================================================
    // CORS CONFIGURATION
    // ==============================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();


        // ==========================================================
        // ALLOWED FRONTENDS
        // ==========================================================

        configuration.setAllowedOrigins(List.of(

                // React local
                "http://localhost:5173",

                // React alternative local
                "http://localhost:3000",

                // Render frontend
                "https://hospital-frontend-7jfj.onrender.com"
        ));


        // ==========================================================
        // ALLOWED METHODS
        // ==========================================================

        configuration.setAllowedMethods(List.of(

                "GET",
                "POST",
                "PUT",
                "DELETE",
                "PATCH",
                "OPTIONS"
        ));


        // ==========================================================
        // ALLOWED HEADERS
        // ==========================================================

        configuration.setAllowedHeaders(List.of(

                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With"
        ));


        // ==========================================================
        // CREDENTIALS
        // ==========================================================

        configuration.setAllowCredentials(true);


        // ==========================================================
        // EXPOSED HEADERS
        // ==========================================================

        configuration.setExposedHeaders(List.of(
                "Authorization"
        ));


        // ==========================================================
        // REGISTER CORS
        // ==========================================================

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );


        return source;
    }
}
