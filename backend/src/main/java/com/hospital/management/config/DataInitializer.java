package com.hospital.management.config;

import com.hospital.management.model.User;
import com.hospital.management.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Creates the first ADMIN account if the database has no admin yet.
 * Set ADMIN_EMAIL / ADMIN_PASSWORD environment variables in production.
 */
@Configuration
public class DataInitializer {

    private static final Logger log =
            LoggerFactory.getLogger(DataInitializer.class);

    private static final String DEFAULT_PASSWORD = "Admin@123";

    @Bean
    CommandLineRunner createDefaultAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email}") String adminEmail,
            @Value("${app.admin.password}") String adminPassword) {

        return args -> {

            if (userRepository.existsByRole("ADMIN")) {
                return;
            }

            if (userRepository.findByEmailIgnoreCase(adminEmail).isPresent()) {
                log.warn("Cannot create default admin: {} already exists "
                        + "with a different role", adminEmail);
                return;
            }

            User admin = new User();
            admin.setName("Administrator");
            admin.setEmail(adminEmail.trim().toLowerCase());
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole("ADMIN");
            userRepository.save(admin);

            log.info("Default admin created: {}", admin.getEmail());

            if (DEFAULT_PASSWORD.equals(adminPassword)) {
                log.warn("Default admin password is in use. "
                        + "Set ADMIN_PASSWORD before deploying to production!");
            }
        };
    }
}
