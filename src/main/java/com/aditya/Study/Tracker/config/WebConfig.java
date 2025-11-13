package com.aditya.Study.Tracker.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuration class to enable Cross-Origin Resource Sharing (CORS).
 * This allows the frontend (running on file:// or a different server)
 * to communicate with the Spring Boot backend during development.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Allows all endpoints under /api/v1 to accept requests from any origin (*).
        // This is safe for development but should be restricted in production.
        registry.addMapping("/api/v1/**")
                .allowedOrigins("*") // Allows requests from all domains/origins
                .allowedMethods("GET", "POST") // Allows only necessary methods
                .allowedHeaders("*"); // Allows all headers
    }
}
