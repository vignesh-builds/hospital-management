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


        // =====================================================
        // IMPORTANT
        // =====================================================
        // OPTIONS request should NEVER be processed by JWT logic.

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {

            filterChain.doFilter(request, response);

            return;
        }


        // =====================================================
        // GET AUTHORIZATION HEADER
        // =====================================================

        String authHeader =
                request.getHeader("Authorization");


        // =====================================================
        // NO TOKEN
        // =====================================================

        if (
                authHeader == null ||
                !authHeader.startsWith("Bearer ")
        ) {

            filterChain.doFilter(request, response);

            return;
        }


        // =====================================================
        // EXTRACT TOKEN
        // =====================================================

        String token =
                authHeader.substring(7);


        try {

            // =================================================
            // VALIDATE JWT
            // =================================================

            Claims claims =
                    Jwts.parser()

                            .verifyWith(
                                    jwtService.getSecretKey()
                            )

                            .build()

                            .parseSignedClaims(token)

                            .getPayload();


            // =================================================
            // EMAIL
            // =================================================

            String email =
                    claims.getSubject();


            // =================================================
            // ROLE
            // =================================================

            String role =
                    claims.get("role", String.class);


            // =================================================
            // USER CHECK
            // =================================================

            if (
                    email == null ||
                    userRepository
                            .findByEmail(email)
                            .isEmpty()
            ) {

                filterChain.doFilter(
                        request,
                        response
                );

                return;
            }


            // =================================================
            // ROLE CHECK
            // =================================================

            if (role == null) {

                filterChain.doFilter(
                        request,
                        response
                );

                return;
            }


            // =================================================
            // CREATE AUTHENTICATION
            // =================================================

            UsernamePasswordAuthenticationToken authentication =

                    new UsernamePasswordAuthenticationToken(

                            email,

                            null,

                            Collections.singletonList(

                                    new SimpleGrantedAuthority(
                                            "ROLE_" + role
                                    )

                            )
                    );


            // =================================================
            // SET SECURITY CONTEXT
            // =================================================

            SecurityContextHolder
                    .getContext()
                    .setAuthentication(
                            authentication
                    );


        } catch (Exception exception) {

            System.out.println(
                    "Invalid JWT token: "
                            + exception.getMessage()
            );

        }


        // =====================================================
        // CONTINUE FILTER CHAIN
        // =====================================================

        filterChain.doFilter(
                request,
                response
        );
    }
}
