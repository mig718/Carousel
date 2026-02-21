package com.carousel.user.service;

import com.carousel.user.domain.AccessLevel;
import com.carousel.user.domain.PendingUser;
import com.carousel.user.domain.User;
import com.carousel.user.dto.PendingUserDto;
import com.carousel.user.dto.RegisterRequest;
import com.carousel.user.dto.RegisterResponse;
import com.carousel.user.dto.UserDto;
import com.carousel.user.repository.PendingUserRepository;
import com.carousel.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import com.carousel.user.client.AuthServiceClient;
import com.carousel.user.client.dto.RegisterCredentialRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PendingUserRepository pendingUserRepository;
    private final AuthServiceClient authServiceClient;
    private JavaMailSender javaMailSender;

    public UserService(UserRepository userRepository, PendingUserRepository pendingUserRepository, AuthServiceClient authServiceClient) {
        this.userRepository = userRepository;
        this.pendingUserRepository = pendingUserRepository;
        this.authServiceClient = authServiceClient;
    }

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public RegisterResponse register(RegisterRequest request) {
        // Check if user already exists
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        Optional<PendingUser> existingPending = pendingUserRepository.findByEmail(request.getEmail());
        if (existingPending.isPresent()) {
            throw new RuntimeException("Registration already pending for this email");
        }

        String verificationToken = UUID.randomUUID().toString();
        
        PendingUser pendingUser = PendingUser.builder()
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .email(request.getEmail())
            .password(request.getPassword())
            .requestedAccessLevel(request.getAccessLevel())
            .emailVerificationToken(verificationToken)
            .emailVerified(false)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        pendingUserRepository.save(pendingUser);

        // Send verification email
        sendVerificationEmail(request.getEmail(), verificationToken);

        boolean requiresApproval = request.getAccessLevel() != AccessLevel.ReadOnly;

        return RegisterResponse.builder()
                .userId(pendingUser.getId())
                .email(pendingUser.getEmail())
                .message("Registration successful. Please verify your email.")
                .requiresApproval(requiresApproval)
                .build();
    }

    public void verifyEmail(String token) {
        Optional<PendingUser> pendingUser = pendingUserRepository.findAll().stream()
                .filter(u -> u.getEmailVerificationToken().equals(token))
                .findFirst();

        if (pendingUser.isEmpty()) {
            throw new RuntimeException("Invalid verification token");
        }

        PendingUser user = pendingUser.get();
        user.setEmailVerified(true);
        user.setUpdatedAt(LocalDateTime.now());
        pendingUserRepository.save(user);
    }

    public void approvePendingUser(String pendingUserId) {
        PendingUser pendingUser = pendingUserRepository.findById(pendingUserId)
                .orElseThrow(() -> new RuntimeException("Pending user not found"));

        if (!pendingUser.isEmailVerified()) {
            throw new RuntimeException("Email not verified");
        }

        // Create credentials in auth-service
        if (pendingUser.getPassword() != null && !pendingUser.getPassword().isEmpty()) {
            RegisterCredentialRequest credentialRequest = new RegisterCredentialRequest(pendingUser.getEmail(), pendingUser.getPassword());
            authServiceClient.registerCredential(credentialRequest);
        }

        User user = User.builder()
                .firstName(pendingUser.getFirstName())
                .lastName(pendingUser.getLastName())
                .email(pendingUser.getEmail())
                .accessLevel(pendingUser.getRequestedAccessLevel())
                .emailVerified(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        // Remove password from PendingUser for security before deleting
        pendingUser.setPassword(null);
        pendingUserRepository.save(pendingUser);
        pendingUserRepository.deleteById(pendingUserId);
    }

    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToDto(user);
    }

    public UserDto getUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToDto(user);
    }

    public List<UserDto> getUsersByAccessLevel(AccessLevel accessLevel) {
        return userRepository.findAll().stream()
                .filter(u -> u.getAccessLevel().ordinal() >= accessLevel.ordinal())
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<PendingUserDto> getVerifiedPendingUsers() {
        return pendingUserRepository.findByEmailVerifiedTrue().stream()
                .map(this::convertToPendingDto)
                .collect(Collectors.toList());
    }

    /**
     * Create a user directly (bypass pending workflow) - only Support and Admin roles allowed.
     * User must still verify their email before accessing the system.
     */
    public UserDto createUserDirectly(String firstName, String lastName, String email, AccessLevel accessLevel, AccessLevel requesterAccessLevel) {
        // Check if requester has sufficient privileges (Support or Admin)
        if (requesterAccessLevel.ordinal() < AccessLevel.Support.ordinal()) {
            throw new RuntimeException("Insufficient privileges to create users");
        }

        // Prevent creation of Admin users by Support (only Admin can create Admin)
        if (accessLevel == AccessLevel.Admin && requesterAccessLevel != AccessLevel.Admin) {
            throw new RuntimeException("Only Admin users can create Admin users");
        }

        // Check if user already exists
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        Optional<PendingUser> existingPending = pendingUserRepository.findByEmail(email);
        if (existingPending.isPresent()) {
            throw new RuntimeException("Registration already pending for this email");
        }

        String verificationToken = UUID.randomUUID().toString();
        
        User user = User.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .accessLevel(accessLevel)
                .emailVerificationToken(verificationToken)
                .emailVerified(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(user);
        sendVerificationEmail(email, verificationToken);

        return convertToDto(user);
    }

    /**
     * Update user information - only Support and Admin roles allowed.
     * Cannot downgrade Admin users to lower access level.
     */
    public UserDto updateUser(String userId, String firstName, String lastName, AccessLevel newAccessLevel, AccessLevel requesterAccessLevel) {
        // Check if requester has sufficient privileges
        if (requesterAccessLevel.ordinal() < AccessLevel.Support.ordinal()) {
            throw new RuntimeException("Insufficient privileges to update users");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Prevent downgrading Admin users (only Admin can change Admin user access level)
        if (user.getAccessLevel() == AccessLevel.Admin && 
            (newAccessLevel != AccessLevel.Admin || requesterAccessLevel != AccessLevel.Admin)) {
            throw new RuntimeException("Cannot downgrade Admin users");
        }

        // Prevent Support users from creating Admin users
        if (newAccessLevel == AccessLevel.Admin && requesterAccessLevel != AccessLevel.Admin) {
            throw new RuntimeException("Only Admin users can assign Admin access level");
        }

        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setAccessLevel(newAccessLevel);
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);
        return convertToDto(user);
    }

    /**
     * Delete user - only Admin role allowed.
     */
    public void deleteUser(String userId, AccessLevel requesterAccessLevel) {
        // Only Admin can delete users
        if (requesterAccessLevel != AccessLevel.Admin) {
            throw new RuntimeException("Insufficient privileges to delete users");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Prevent deletion of other Admin users
        if (user.getAccessLevel() == AccessLevel.Admin && !user.getId().equals(userId)) {
            throw new RuntimeException("Cannot delete other Admin users");
        }

        userRepository.deleteById(userId);
    }

    /**
     * List all users - Support and Admin can view users up to their level or below.
     */
    public List<UserDto> getAllUsers(AccessLevel requesterAccessLevel) {
        // Check if requester has sufficient privileges
        if (requesterAccessLevel.ordinal() < AccessLevel.Support.ordinal()) {
            throw new RuntimeException("Insufficient privileges to list users");
        }

        return userRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private void sendVerificationEmail(String email, String token) {
        if (mailSender == null) {
            return; // Skip if mail sender not configured
        }
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Carousel - Email Verification");
        message.setText("Please click the link to verify your email: " +
                "http://localhost:3000/verify?token=" + token);
        
        try {
            mailSender.send(message);
        } catch (Exception e) {
            // Log error but don't fail the registration
            System.err.println("Failed to send verification email: " + e.getMessage());
        }
    }

    private UserDto convertToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .accessLevel(user.getAccessLevel())
                .build();
    }

    private PendingUserDto convertToPendingDto(PendingUser user) {
        return PendingUserDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .requestedAccessLevel(user.getRequestedAccessLevel())
                .emailVerified(user.isEmailVerified())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

