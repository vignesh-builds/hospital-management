package com.hospital.management.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@carepoint-hospital.com}")
    private String fromAddress;

    public void sendEmail(String to, String subject, String body) {
        log.info("Sending email to [{}] with subject [{}]", to, subject);
        if (mailSender == null) {
            log.warn("JavaMailSender bean is not configured. Email to [{}] not sent via SMTP. Content:\n{}", to, body);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email successfully sent to [{}]", to);
        } catch (Exception ex) {
            // Log warning instead of failing the API request so users can still proceed in development / offline mode
            log.warn("Failed to dispatch email to [{}]: {}. Message body:\n{}", to, ex.getMessage(), body);
        }
    }

    public void sendStaffWelcomeEmail(String to, String name, String role, String temporaryPassword) {
        String subject = "Your CarePoint Staff Account Credentials";
        String body = String.format(
            "Hello %s,\n\n" +
            "Your staff account has been created at CarePoint Hospital Management System.\n\n" +
            "Role: %s\n" +
            "Login Email: %s\n" +
            "Temporary Password: %s\n\n" +
            "For security reasons, you will be required to change this temporary password upon your first login.\n\n" +
            "Best regards,\n" +
            "CarePoint Hospital Administration",
            name, role, to, temporaryPassword
        );
        sendEmail(to, subject, body);
    }

    public void sendPasswordResetOtpEmail(String to, String name, String otp) {
        String subject = "Password Reset Request - CarePoint Hospital";
        String body = String.format(
            "Hello %s,\n\n" +
            "We received a request to reset your password for your CarePoint Hospital account.\n\n" +
            "Your 6-digit Verification Code (OTP) is: %s\n\n" +
            "This code is valid for 15 minutes. If you did not request this, please ignore this email or contact hospital administration.\n\n" +
            "Best regards,\n" +
            "CarePoint Hospital Support Team",
            name != null ? name : "User", otp
        );
        sendEmail(to, subject, body);
    }
}
