package com.carousel.role.client;

import com.carousel.role.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(
    name = "user-service",
    url = "${carousel.clients.user-service-url:http://localhost:8002}",
    path = "/api/users"
)
public interface UserServiceClient {
    @GetMapping("/email/{email}")
    UserDto getUserByEmail(@PathVariable String email);

    @GetMapping("/{userId}")
    UserDto getUserById(@PathVariable String userId);

    @GetMapping("/admin/all")
    List<UserDto> getAllUsers(@RequestParam String requesterEmail);
}
