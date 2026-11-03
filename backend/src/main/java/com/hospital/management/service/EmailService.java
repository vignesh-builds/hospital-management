package com.hospital.management.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${BREVO_API_KEY:${brevo.api.key:}}")
    private String brevoApiKey;

    @Value("${BREVO_SENDER_EMAIL:${brevo.sender.email:vignesh.builds@gmail.com}}")
    private String senderEmail;

    @Value("${BREVO_SENDER_NAME:CarePoint Hospital}")
    private String senderName;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Async
    public void sendEmail(String toEmail, String subject, String body) {
        log.info("Sending email to [{}] with subject [{}] via Brevo HTTP API", toEmail, subject);

        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            log.warn("BREVO_API_KEY is missing. Email dispatch skipped. Message:\n{}", body);
            return;
        }

        try {
            String escapedSubject = escapeJson(subject);
            String escapedHtml = escapeJson(body.replace("\r\n", "<br/>").replace("\n", "<br/>"));
            String escapedSenderName = escapeJson(senderName);

            String payload = String.format(
                "{\"sender\":{\"name\":\"%s\",\"email\":\"%s\"}," +
                "\"to\":[{\"email\":\"%s\"}]," +
                "\"subject\":\"%s\"," +
                "\"htmlContent\":\"<div style=\\\"font-family:sans-serif;line-height:1.6;\\\">%s</div>\"}",
                escapedSenderName,
                senderEmail,
                toEmail,
                escapedSubject,
                escapedHtml
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("api-key", brevoApiKey.trim())
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Email sent successfully to [{}]. Brevo response: {}", toEmail, response.body());
            } else {
                log.error("Failed to dispatch email to [{}]: HTTP {} Response: {}",
                        toEmail, response.statusCode(), response.body());
            }
        } catch (Exception ex) {
            log.error("Failed to dispatch email to [{}]: {}", toEmail, ex.getMessage(), ex);
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
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\b", "\\b")
                   .replace("\f", "\\f")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }
}
