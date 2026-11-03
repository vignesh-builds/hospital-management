package com.hospital.management.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${resend.api.key}")
    private String resendApiKey;

    @Value("${resend.from.email:onboarding@resend.dev}")
    private String fromEmail;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public void sendEmail(String toEmail, String subject, String body) {
        log.info("Sending email to [{}] with subject [{}] via Resend API", toEmail, subject);

        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.error("RESEND_API_KEY is not configured!");
            return;
        }

        try {
            // Escape special JSON characters in content
            String escapedSubject = subject.replace("\"", "\\\"");
            String escapedBody = body.replace("\\", "\\\\")
                                     .replace("\"", "\\\"")
                                     .replace("\n", "<br/>");

            String jsonPayload = String.format(
                "{\"from\":\"CarePoint Hospital <%s>\",\"to\":[\"%s\"],\"subject\":\"%s\",\"html\":\"<p>%s</p>\"}",
                fromEmail,
                toEmail,
                escapedSubject,
                escapedBody
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Email sent successfully to [{}]. Response: {}", toEmail, response.body());
            } else {
                log.warn("Failed to dispatch email to [{}]: Status {} Response: {}", 
                         toEmail, response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Exception occurred while sending email to [{}]: {}", toEmail, e.getMessage(), e);
        }
    }
}
