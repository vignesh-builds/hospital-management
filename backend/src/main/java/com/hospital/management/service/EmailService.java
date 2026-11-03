package com.hospital.management.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${resend.from.email:onboarding@resend.dev}")
    private String fromEmail;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public void sendEmail(String toEmail, String subject, String body) {
        log.info("Sending email to [{}] with subject [{}] via Resend API", toEmail, subject);

        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("RESEND_API_KEY is not configured. Email dispatch skipped. Message body:\n{}", body);
            return;
        }

        try {
            String escapedSubject = escapeJson(subject);
            String escapedHtml = escapeJson(body.replace("\r\n", "<br/>").replace("\n", "<br/>"));

            String payload = String.format(
                "{\"from\":\"CarePoint Hospital <%s>\",\"to\":[\"%s\"],\"subject\":\"%s\",\"html\":\"<div style=\\\"font-family:sans-serif;line-height:1.6;\\\">%s</div>\"}",
                fromEmail,
                toEmail,
                escapedSubject,
                escapedHtml
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey.trim())
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Email sent successfully to [{}]. Resend response: {}", toEmail, response.body());
            } else {
                log.warn("Failed to dispatch email to [{}]: HTTP {} Response: {}. Message body:\n{}",
                        toEmail, response.statusCode(), response.body(), body);
            }
        } catch (Exception ex) {
            log.warn("Failed to dispatch email to [{}]: {}. Message body:\n{}",
                    toEmail, ex.getMessage(), body);
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

    private String escapeJson(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\b", "\\b")
                   .replace("\f", "\\f")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }
}
