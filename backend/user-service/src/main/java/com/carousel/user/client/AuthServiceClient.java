package com.carousel.user.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.carousel.user.client.dto.RegisterCredentialRequest;

@FeignClient(name = "auth-service", path = "/")
public interface AuthServiceClient {
    @PostMapping("/register")
    String registerCredential(@RequestBody RegisterCredentialRequest request);
}

