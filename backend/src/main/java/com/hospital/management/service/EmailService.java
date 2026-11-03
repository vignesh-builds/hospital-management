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

    @Value("${spring.mail.username:vignesh.builds@gmail.com}")
    private String senderEmail;

    public void sendEmail(String toEmail, String subject, String body) {
        log.info("Sending email to [{}] with subject [{}] via Gmail SMTP", toEmail, subject);

        if (mailSender == null) {
            log.warn("JavaMailSender is not configured. Email dispatch skipped. Message body:\n{}", body);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
            log.info("Email sent successfully to [{}]", toEmail);
        } catch (Exception ex) {
            log.error("Failed to send email to [{}]: {}", toEmail, ex.getMessage(), ex);
        }
    }

    public void sendStaffWelcomeEmail(String toEmail, String name, String username, String tempPassword) {
        String subject = "Welcome to CarePoint Hospital - Your Account Details";
        String body = String.format(
            "Hello %s,\n\n" +
            "Your account has been created successfully at CarePoint Hospital.\n\n" +
            "Username / Email: %s\n" +
            "Temporary Password: %s\n\n" +
            "Please log in and update your password immediately.\n\n" +
            "Best regards,\nCarePoint Hospital Administration Team",
            name, username, tempPassword
        );
        sendEmail(toEmail, subject, body);
    }

    public void sendPasswordResetOtpEmail(String toEmail, String name, String otp) {
        String subject = "Password Reset Request - CarePoint Hospital";
        String body = String.format(
            "Hello %s,\n\n" +
            "We received a request to reset your password for your CarePoint Hospital account.\n\n" +
            "Your 6-digit Verification Code (OTP) is: %s\n\n" +
            "This code is valid for 15 minutes. If you did not request this, please ignore this email or contact hospital administration.\n\n" +
            "Best regards,\nCarePoint Hospital Support Team",
            name, otp
        );
        sendEmail(toEmail, subject, body);
    }
}
