package com.carousel.approval.client;

import com.carousel.approval.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

@FeignClient(name = "user-service", path = "/api/users")
public interface UserServiceClient {
    
    @PostMapping("/approve/{pendingUserId}")
    void approvePendingUser(@PathVariable String pendingUserId);
}

