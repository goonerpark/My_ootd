package com.ootd.backend.weather.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(WeatherProperties.class)
public class WeatherConfig {

    @Bean
    public RestClient restClient() {
        return RestClient.builder().build();
    }
}
