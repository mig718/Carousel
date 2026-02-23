package com.carousel.inventory.client;

import com.carousel.inventory.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", path = "/api/users")
public interface UserServiceClient {
    @GetMapping("/email/{email}")
    UserDto getUserByEmail(@PathVariable String email);
}
