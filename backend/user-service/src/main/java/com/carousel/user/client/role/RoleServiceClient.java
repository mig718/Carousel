package com.carousel.user.client.role;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "role-service", path = "/api/roles")
public interface RoleServiceClient {
    @GetMapping("/user/{email}/has/{roleName}")
    Boolean userHasRole(@PathVariable String email, @PathVariable String roleName);

    @PostMapping("/internal/assign-default")
    void assignDefaultRole(@RequestParam String userEmail);
}
