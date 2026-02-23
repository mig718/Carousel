package com.carousel.inventory.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "role-service", path = "/api/roles")
public interface RoleServiceClient {
    @GetMapping("/user/{email}")
    List<String> getRolesForUser(@PathVariable String email);
}
