package com.carousel.approval.client;

import com.carousel.approval.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "user-service", path = "/api/users")
public interface UserServiceClient {

    @GetMapping("/email/{email}")
    UserDto getUserByEmail(@PathVariable String email);
    
    @PostMapping("/approve/{pendingUserId}")
    void approvePendingUser(@PathVariable String pendingUserId);

    @PutMapping("/internal/{userId}/access-level")
    void updateUserAccessLevel(@PathVariable String userId, @RequestParam String accessLevel);
}

