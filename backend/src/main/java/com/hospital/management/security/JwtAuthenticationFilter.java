```java
package com.hospital.management.security;

import com.hospital.management.model.User;
import com.hospital.management.repository.UserRepository;
import com.hospital.management.service.JwtService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log =
            LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        // Allow CORS preflight requests.
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        // Public endpoints can continue without a token.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = authHeader.substring(7);

            Claims claims = Jwts.parser()
                    .verifyWith(jwtService.getSecretKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String email = claims.getSubject();

            if (email == null || email.isBlank()) {
                reject(response, HttpServletResponse.SC_UNAUTHORIZED,
                        "Invalid authentication token");
                return;
            }

            Optional<User> optionalUser =
                    userRepository.findByEmailIgnoreCase(email);

            if (optionalUser.isEmpty()) {
                reject(response, HttpServletResponse.SC_UNAUTHORIZED,
                        "User account not found");
                return;
            }

            User user = optionalUser.get();

            if (user.getRole() == null || user.getRole().isBlank()) {
                reject(response, HttpServletResponse.SC_UNAUTHORIZED,
                        "User role not found");
                return;
            }

            // Use the role currently stored in the database.
            String role = user.getRole();

            if (role.startsWith("ROLE_")) {
                role = role.substring(5);
            }

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            user.getEmail(),
                            null,
                            Collections.singletonList(
                                    new SimpleGrantedAuthority("ROLE_" + role)
                            )
                    );

            SecurityContextHolder.getContext()
                    .setAuthentication(authentication);

            String path = request.getServletPath();

            boolean isChangePasswordEndpoint =
                    "POST".equalsIgnoreCase(request.getMethod())
                            && "/auth/change-password".equals(path);

            // A temporary-password user can only change their password.
            if (user.isMustChangePassword()
                    && !isChangePasswordEndpoint) {

                SecurityContextHolder.clearContext();

                reject(response, HttpServletResponse.SC_FORBIDDEN,
                        "Change your temporary password before continuing");
                return;
            }

        } catch (Exception exception) {
            SecurityContextHolder.clearContext();

            log.debug("JWT authentication failed: {}",
                    exception.getMessage());

            reject(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "Invalid or expired authentication token");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void reject(
            HttpServletResponse response,
            int status,
            String message) throws IOException {

        response.sendError(status, message);
    }
}
```
