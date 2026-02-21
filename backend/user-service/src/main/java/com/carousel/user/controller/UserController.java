package com.carousel.user.controller;

import com.carousel.user.domain.AccessLevel;
import com.carousel.user.dto.*;
import com.carousel.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@Tag(name = "User Management", description = "User management and enrollment endpoints")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
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

    @GetMapping("/me")
    @Operation(summary = "Get current user profile", description = "Get current authenticated user's profile")
    public ResponseEntity<UserDto> getCurrentUser(@RequestParam String email) {
        return ResponseEntity.ok(userService.getCurrentUserByEmail(email));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile", description = "Update current authenticated user's profile")
    public ResponseEntity<UserDto> updateCurrentUser(
            @RequestBody UpdateOwnProfileRequest request,
            @RequestParam String email) {
        return ResponseEntity.ok(userService.updateOwnProfile(email, request.getFirstName(), request.getLastName()));
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
    public ResponseEntity<UserDto> createUserDirectly(@RequestBody DirectUserCreationRequest request, @RequestParam String requesterEmail) {
        return ResponseEntity.ok(userService.createUserDirectly(
                request.getFirstName(),
                request.getLastName(),
                request.getEmail(),
                request.getAccessLevel(),
                requesterEmail
        ));
    }

        @PutMapping("/admin/{userId}")
        @Operation(summary = "Update user (Admin only)", description = "Update user information - Support/Admin only")
        public ResponseEntity<UserDto> updateUser(
            @PathVariable String userId,
            @RequestBody UpdateUserRequest request,
            @RequestParam String requesterEmail) {
        return ResponseEntity.ok(userService.updateUser(
            userId,
            request.getFirstName(),
            request.getLastName(),
            request.getAccessLevel(),
            requesterEmail
        ));
        }

    @DeleteMapping("/admin/{userId}")
    @Operation(summary = "Delete user (Admin only)", description = "Delete a user - Admin only")
    public ResponseEntity<String> deleteUser(@PathVariable String userId, @RequestParam String requesterEmail) {
        userService.deleteUser(userId, requesterEmail);
        return ResponseEntity.ok("User deleted successfully");
    }

    @GetMapping("/admin/all")
    @Operation(summary = "List all users (Admin only)", description = "List all users in the system - Support/Admin only")
    public ResponseEntity<List<UserDto>> getAllUsers(@RequestParam String requesterEmail) {
        return ResponseEntity.ok(userService.getAllUsers(requesterEmail));
    }

    @PutMapping("/internal/{userId}/access-level")
    @Operation(summary = "Update user access level internally", description = "Internal endpoint used by approval-service")
    public ResponseEntity<String> updateAccessLevelInternal(
            @PathVariable String userId,
            @RequestParam AccessLevel accessLevel) {
        userService.updateAccessLevelInternal(userId, accessLevel);
        return ResponseEntity.ok("Access level updated successfully");
    }
}

