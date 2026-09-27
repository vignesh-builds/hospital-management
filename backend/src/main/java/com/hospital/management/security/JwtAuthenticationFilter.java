package com.hospital.management.security;

import com.hospital.management.repository.UserRepository;
import com.hospital.management.service.JwtService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter
        extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader =
                request.getHeader("Authorization");

        // No token
        if (authHeader == null ||
                !authHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        String token =
                authHeader.substring(7);

        try {

            Claims claims =
                    Jwts.parser()
                            .verifyWith(
                                    jwtService.getSecretKey()
                            )
                            .build()
                            .parseSignedClaims(token)
                            .getPayload();

            String email =
                    claims.getSubject();

            String role =
                    claims.get("role", String.class);

            System.out.println(
                    "JWT email: " + email
            );

            System.out.println(
                    "JWT role: " + role
            );

            // Email missing
            if (email == null || email.isBlank()) {

                System.out.println(
                        "JWT email is missing"
                );

                filterChain.doFilter(
                        request,
                        response
                );

                return;
            }

            // Role missing
            if (role == null || role.isBlank()) {

                System.out.println(
                        "JWT role is missing"
                );

                filterChain.doFilter(
                        request,
                        response
                );

                return;
            }

            // User does not exist
            if (userRepository
                    .findByEmail(email)
                    .isEmpty()) {

                System.out.println(
                        "User not found: " + email
                );

                filterChain.doFilter(
                        request,
                        response
                );

                return;
            }

            // Remove ROLE_ if already present
            if (role.startsWith("ROLE_")) {
                role = role.substring(5);
            }

            SimpleGrantedAuthority authority =
                    new SimpleGrantedAuthority(
                            "ROLE_" + role
                    );

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            Collections.singletonList(
                                    authority
                            )
                    );

            SecurityContextHolder
                    .getContext()
                    .setAuthentication(
                            authentication
                    );

            System.out.println(
                    "Authentication successful for: "
                            + email
                            + " | ROLE_" + role
            );

        } catch (Exception exception) {

            System.out.println(
                    "JWT authentication failed: "
                            + exception.getMessage()
            );

            SecurityContextHolder
                    .clearContext();
        }

        filterChain.doFilter(
                request,
                response
        );
    }
}
