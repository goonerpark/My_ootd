package com.ootd.backend.ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "gemini")
public class GeminiProperties {

    private boolean enabled = true;
    private String apiKey;
    private String model = "gemini-2.5-flash";
    private String baseUrl = "https://generativelanguage.googleapis.com";
}
