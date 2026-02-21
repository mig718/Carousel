package com.carousel.approval.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class WebConfig {
    // CORS is handled by API Gateway - no need to configure here
    // This prevents duplicate CORS headers
}

