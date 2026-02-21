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
import com.carousel.user.client.role.RoleServiceClient;
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
    private final RoleServiceClient roleServiceClient;
    private JavaMailSender javaMailSender;

    public UserService(
            UserRepository userRepository,
            PendingUserRepository pendingUserRepository,
            AuthServiceClient authServiceClient,
            RoleServiceClient roleServiceClient
    ) {
        this.userRepository = userRepository;
        this.pendingUserRepository = pendingUserRepository;
        this.authServiceClient = authServiceClient;
        this.roleServiceClient = roleServiceClient;
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
        AccessLevel requestedAccessLevel = request.getAccessLevel() == null ? AccessLevel.User : request.getAccessLevel();
        
        PendingUser pendingUser = PendingUser.builder()
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .email(request.getEmail())
            .password(request.getPassword())
            .requestedAccessLevel(requestedAccessLevel)
            .emailVerificationToken(verificationToken)
            .emailVerified(false)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        pendingUserRepository.save(pendingUser);

        // Send verification email
        sendVerificationEmail(request.getEmail(), verificationToken);

        boolean requiresApproval = requestedAccessLevel == AccessLevel.Admin;

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
        assignDefaultRoleQuietly(user.getEmail());

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

    public UserDto getCurrentUserByEmail(String email) {
        return getUserByEmail(email);
    }

    public UserDto getUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToDto(user);
    }

    public UserDto updateOwnProfile(String email, String firstName, String lastName) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);
        return convertToDto(user);
    }

    public void updateAccessLevelInternal(String userId, AccessLevel accessLevel) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setAccessLevel(accessLevel);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
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
    public UserDto createUserDirectly(String firstName, String lastName, String email, AccessLevel accessLevel, String requesterEmail) {
        if (!canManageUsers(requesterEmail)) {
            throw new RuntimeException("Insufficient role privileges to create users");
        }

        AccessLevel effectiveAccessLevel = accessLevel == null ? AccessLevel.User : accessLevel;

        if (effectiveAccessLevel == AccessLevel.Admin && !isAdmin(requesterEmail)) {
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
            .accessLevel(effectiveAccessLevel)
                .emailVerificationToken(verificationToken)
                .emailVerified(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(user);
        assignDefaultRoleQuietly(user.getEmail());
        sendVerificationEmail(email, verificationToken);

        return convertToDto(user);
    }

    /**
     * Update user information - only Support and Admin roles allowed.
     * Cannot downgrade Admin users to lower access level.
     */
    public UserDto updateUser(String userId, String firstName, String lastName, AccessLevel newAccessLevel, String requesterEmail) {
        if (!canManageUsers(requesterEmail)) {
            throw new RuntimeException("Insufficient role privileges to update users");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        AccessLevel effectiveNewAccessLevel = newAccessLevel == null ? user.getAccessLevel() : newAccessLevel;

        if (user.getAccessLevel() == AccessLevel.Admin && 
            (effectiveNewAccessLevel != AccessLevel.Admin || !isAdmin(requesterEmail))) {
            throw new RuntimeException("Cannot downgrade Admin users");
        }

        if (effectiveNewAccessLevel == AccessLevel.Admin && !isAdmin(requesterEmail)) {
            throw new RuntimeException("Only Admin users can assign Admin access level");
        }

        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setAccessLevel(effectiveNewAccessLevel);
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);
        return convertToDto(user);
    }

    /**
     * Delete user - only Admin role allowed.
     */
    public void deleteUser(String userId, String requesterEmail) {
        if (!canManageUsers(requesterEmail)) {
            throw new RuntimeException("Insufficient role privileges to delete users");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getAccessLevel() == AccessLevel.Admin && !isAdmin(requesterEmail)) {
            throw new RuntimeException("Cannot delete other Admin users");
        }

        userRepository.deleteById(userId);
    }

    /**
     * List all users - Support and Admin can view users up to their level or below.
     */
    public List<UserDto> getAllUsers(String requesterEmail) {
        if (!canManageUsers(requesterEmail)) {
            throw new RuntimeException("Insufficient role privileges to list users");
        }

        return userRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private boolean canManageUsers(String requesterEmail) {
        if (isAdmin(requesterEmail)) {
            return true;
        }

        try {
            Boolean hasSupportRole = roleServiceClient.userHasRole(requesterEmail, "Support");
            return Boolean.TRUE.equals(hasSupportRole);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isAdmin(String email) {
        return userRepository.findByEmail(email)
                .map(user -> user.getAccessLevel() == AccessLevel.Admin)
                .orElse(false);
    }

    private void assignDefaultRoleQuietly(String userEmail) {
        try {
            roleServiceClient.assignDefaultRole(userEmail);
        } catch (Exception e) {
        }
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

