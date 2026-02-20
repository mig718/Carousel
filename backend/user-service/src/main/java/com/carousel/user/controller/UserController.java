package com.carousel.user.controller;

import com.carousel.user.domain.AccessLevel;
import com.carousel.user.dto.*;
import com.carousel.user.repository.UserRepository;
import com.carousel.user.service.UserService;
import com.carousel.user.session.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@Tag(name = "User Management", description = "User management and enrollment endpoints")
public class UserController {
    private final UserService userService;
    private final UserRepository userRepository;
    private final SessionService sessionService;

    public UserController(UserService userService, UserRepository userRepository, SessionService sessionService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.sessionService = sessionService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Register a new user for system access")
    public ResponseEntity<RegisterResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }

    @GetMapping("/verify")
    @Operation(summary = "Verify email", description = "Verify user email with token")
    public ResponseEntity<String> verifyEmail(@RequestParam String token) {
        userService.verifyEmail(token);
        return ResponseEntity.ok("Email verified successfully");
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get user by ID", description = "Retrieve user information by user ID")
    public ResponseEntity<UserDto> getUser(@PathVariable String userId) {
        return ResponseEntity.ok(userService.getUser(userId));
    }

    @GetMapping("/email/{email}")
    @Operation(summary = "Get user by email", description = "Retrieve user information by email")
    public ResponseEntity<UserDto> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @GetMapping("/access-level/{accessLevel}")
    @Operation(summary = "Get users by access level", description = "Get all users with equal or higher access level")
    public ResponseEntity<List<UserDto>> getUsersByAccessLevel(@PathVariable AccessLevel accessLevel) {
        return ResponseEntity.ok(userService.getUsersByAccessLevel(accessLevel));
    }

    @GetMapping("/pending/verified")
    @Operation(summary = "Get verified pending users", description = "Get all pending users whose email has been verified")
    public ResponseEntity<List<PendingUserDto>> getVerifiedPendingUsers() {
        return ResponseEntity.ok(userService.getVerifiedPendingUsers());
    }

    @PostMapping("/approve/{pendingUserId}")
    @Operation(summary = "Approve pending user", description = "Approve a pending user and create full user account")
    public ResponseEntity<String> approvePendingUser(@PathVariable String pendingUserId) {
        userService.approvePendingUser(pendingUserId);
        return ResponseEntity.ok("User approved successfully");
    }

    // Admin endpoints for user management
    @PostMapping("/admin/create")
    @Operation(summary = "Create user directly (Admin only)", description = "Create a user directly bypassing pending workflow - Support/Admin only")
    public ResponseEntity<UserDto> createUserDirectly(@RequestBody DirectUserCreationRequest request, @RequestHeader("Authorization") String authHeader) {
        AccessLevel requesterAccessLevel = getAccessLevelFromToken(authHeader);
        return ResponseEntity.ok(userService.createUserDirectly(
                request.getFirstName(),
                request.getLastName(),
                request.getEmail(),
                request.getAccessLevel(),
                requesterAccessLevel
        ));
    }

        @PutMapping("/admin/{userId}")
        @Operation(summary = "Update user (Admin only)", description = "Update user information - Support/Admin only")
        public ResponseEntity<UserDto> updateUser(
            @PathVariable String userId,
            @RequestBody UpdateUserRequest request,
            @RequestHeader("Authorization") String authHeader) {
        AccessLevel requesterAccessLevel = getAccessLevelFromToken(authHeader);
        return ResponseEntity.ok(userService.updateUser(
            userId,
            request.getFirstName(),
            request.getLastName(),
            request.getAccessLevel(),
            requesterAccessLevel
        ));
        }

    @DeleteMapping("/admin/{userId}")
    @Operation(summary = "Delete user (Admin only)", description = "Delete a user - Admin only")
    public ResponseEntity<String> deleteUser(@PathVariable String userId, @RequestHeader("Authorization") String authHeader) {
        AccessLevel requesterAccessLevel = getAccessLevelFromToken(authHeader);
        userService.deleteUser(userId, requesterAccessLevel);
        return ResponseEntity.ok("User deleted successfully");
    }

    @GetMapping("/admin/all")
    @Operation(summary = "List all users (Admin only)", description = "List all users in the system - Support/Admin only")
    public ResponseEntity<List<UserDto>> getAllUsers(@RequestHeader("Authorization") String authHeader) {
        AccessLevel requesterAccessLevel = getAccessLevelFromToken(authHeader);
        return ResponseEntity.ok(userService.getAllUsers(requesterAccessLevel));
    }

    // Extract access level from JWT token
    private AccessLevel getAccessLevelFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Not authenticated");
        }
        String token = authHeader.replace("Bearer ", "");
        try {
            String accessLevel = sessionService.getAccessLevelFromToken(token);
            return AccessLevel.valueOf(accessLevel);
        } catch (Exception e) {
            throw new RuntimeException("Invalid or expired session");
        }
    }
}

