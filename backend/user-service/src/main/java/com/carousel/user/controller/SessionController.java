package com.carousel.user.controller;

import com.carousel.user.domain.User;
import com.carousel.user.dto.LoginRequest;
import com.carousel.user.dto.LoginResponse;
import com.carousel.user.repository.UserRepository;
import com.carousel.user.session.SessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class SessionController {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SessionService sessionService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .filter(u -> u.getPassword().equals(request.getPassword())) // Replace with hashed check in production
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        String token = sessionService.generateToken(user);
        return ResponseEntity.ok(new LoginResponse(token));
    }

    @PostMapping("/extend-session")
    public ResponseEntity<LoginResponse> extendSession(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (sessionService.isTokenExpired(token)) {
            throw new RuntimeException("Session expired");
        }
        String newToken = sessionService.extendToken(token);
        return ResponseEntity.ok(new LoginResponse(newToken));
    }
}

