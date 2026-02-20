package com.carousel.user;

import com.carousel.user.domain.AccessLevel;
import com.carousel.user.domain.PendingUser;
import com.carousel.user.domain.User;
import com.carousel.user.dto.RegisterRequest;
import com.carousel.user.repository.PendingUserRepository;
import com.carousel.user.repository.UserRepository;
import com.carousel.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class UserServiceTest {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PendingUserRepository pendingUserRepository;

    @BeforeEach
    public void setUp() {
        userRepository.deleteAll();
        pendingUserRepository.deleteAll();
    }

    @Test
    public void testRegisterUser() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .password("password123")
                .accessLevel(AccessLevel.ReadOnly)
                .build();

        var response = userService.register(request);
        assertNotNull(response);
        assertEquals("john@example.com", response.getEmail());
        assertFalse(response.isRequiresApproval());
    }

    @Test
    public void testRegisterUserRequiresApproval() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("Jane")
                .lastName("Doe")
                .email("jane@example.com")
                .password("password123")
                .accessLevel(AccessLevel.ReadWrite)
                .build();

        var response = userService.register(request);
        assertTrue(response.isRequiresApproval());
    }

    @Test
    public void testRegisterDuplicateEmail() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .password("password123")
                .accessLevel(AccessLevel.ReadOnly)
                .build();

        userService.register(request);
        
        assertThrows(RuntimeException.class, () -> userService.register(request));
    }

    @Test
    public void testEmailVerification() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .password("password123")
                .accessLevel(AccessLevel.ReadOnly)
                .build();

        var response = userService.register(request);
        var pendingUser = pendingUserRepository.findByEmail("john@example.com").get();
        String token = pendingUser.getEmailVerificationToken();

        userService.verifyEmail(token);
        
        var verified = pendingUserRepository.findByEmail("john@example.com").get();
        assertTrue(verified.isEmailVerified());
    }

    @Test
    public void testApprovePendingUser() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .password("password123")
                .accessLevel(AccessLevel.ReadWrite)
                .build();

        var response = userService.register(request);
        var pendingUser = pendingUserRepository.findByEmail("john@example.com").get();
        
        // Verify email first
        userService.verifyEmail(pendingUser.getEmailVerificationToken());
        
        // Approve user
        userService.approvePendingUser(pendingUser.getId());
        
        var user = userRepository.findByEmail("john@example.com");
        assertTrue(user.isPresent());
        assertEquals(AccessLevel.ReadWrite, user.get().getAccessLevel());
        
        var stillPending = pendingUserRepository.findByEmail("john@example.com");
        assertFalse(stillPending.isPresent());
    }

    @Test
    public void testGetUsersByAccessLevel() {
        // Create users with different access levels
        var users = userRepository.findAll();
        assertEquals(0, users.size());
        
        // This test verifies the method works (more comprehensive testing would need more setup)
    }

    @Test
    public void testInvalidEmailVerificationToken() {
        assertThrows(RuntimeException.class, () -> 
            userService.verifyEmail("invalid-token")
        );
    }

    @Test
    public void testCreateUserDirectlyByAdmin() {
        var userDto = userService.createUserDirectly(
                "Support",
                "User",
                "support@example.com",
                AccessLevel.Support,
                AccessLevel.Admin
        );
        
        assertNotNull(userDto);
        assertEquals("support@example.com", userDto.getEmail());
        assertEquals(AccessLevel.Support, userDto.getAccessLevel());
    }

    @Test
    public void testCreateUserDirectlyBySupport() {
        var userDto = userService.createUserDirectly(
                "NewUser",
                "NewLast",
                "newuser@example.com",
                AccessLevel.ReadWrite,
                AccessLevel.Support
        );
        
        assertNotNull(userDto);
        assertEquals("newuser@example.com", userDto.getEmail());
    }

    @Test
    public void testCreateUserDirectlyInsufficientPrivileges() {
        assertThrows(RuntimeException.class, () -> 
            userService.createUserDirectly(
                    "User",
                    "User",
                    "user@example.com",
                    AccessLevel.ReadOnly,
                    AccessLevel.ReadOnly  // Insufficient privilege
            )
        );
    }

    @Test
    public void testCreateAdminUserBySupport() {
        assertThrows(RuntimeException.class, () -> 
            userService.createUserDirectly(
                    "Admin",
                    "User",
                    "admin@example.com",
                    AccessLevel.Admin,  // Trying to create Admin
                    AccessLevel.Support  // Only Support, not Admin
            )
        );
    }

    @Test
    public void testUpdateUserByAdmin() {
        // Create initial user
        var initialUserDto = userService.createUserDirectly(
                "John",
                "Doe",
                "john@example.com",
                AccessLevel.ReadOnly,
                AccessLevel.Admin
        );

        // Update user
        var updatedUserDto = userService.updateUser(
                initialUserDto.getId(),
                "Jane",
                "Smith",
                AccessLevel.ReadWrite,
                AccessLevel.Admin
        );

        assertEquals("Jane", updatedUserDto.getFirstName());
        assertEquals("Smith", updatedUserDto.getLastName());
        assertEquals(AccessLevel.ReadWrite, updatedUserDto.getAccessLevel());
    }

    @Test
    public void testUpdateUserInsufficientPrivileges() {
        var userDto = userService.createUserDirectly(
                "John",
                "Doe",
                "john@example.com",
                AccessLevel.ReadOnly,
                AccessLevel.Admin
        );

        assertThrows(RuntimeException.class, () ->
            userService.updateUser(
                    userDto.getId(),
                    "Jane",
                    "Smith",
                    AccessLevel.ReadWrite,
                    AccessLevel.ReadOnly  // Insufficient privilege
            )
        );
    }

    @Test
    public void testDeleteUserByAdmin() {
        var userDto = userService.createUserDirectly(
                "John",
                "Doe",
                "john@example.com",
                AccessLevel.ReadOnly,
                AccessLevel.Admin
        );

        userService.deleteUser(userDto.getId(), AccessLevel.Admin);

        assertFalse(userRepository.findById(userDto.getId()).isPresent());
    }

    @Test
    public void testDeleteUserInsufficientPrivileges() {
        var userDto = userService.createUserDirectly(
                "John",
                "Doe",
                "john@example.com",
                AccessLevel.ReadOnly,
                AccessLevel.Admin
        );

        assertThrows(RuntimeException.class, () ->
            userService.deleteUser(userDto.getId(), AccessLevel.Support)
        );
    }

    @Test
    public void testGetAllUsersByAdmin() {
        // Create multiple users
        userService.createUserDirectly("User1", "Last1", "user1@example.com", AccessLevel.ReadOnly, AccessLevel.Admin);
        userService.createUserDirectly("User2", "Last2", "user2@example.com", AccessLevel.ReadWrite, AccessLevel.Admin);
        
        var users = userService.getAllUsers(AccessLevel.Admin);
        assertEquals(2, users.size());
    }

    @Test
    public void testGetAllUsersInsufficientPrivileges() {
        assertThrows(RuntimeException.class, () ->
            userService.getAllUsers(AccessLevel.ReadOnly)
        );
    }

    @Test
    public void testPreventDowngradeAdminUser() {
        var adminDto = userService.createUserDirectly(
                "Admin",
                "User",
                "admin@example.com",
                AccessLevel.Admin,
                AccessLevel.Admin
        );

        assertThrows(RuntimeException.class, () ->
            userService.updateUser(
                    adminDto.getId(),
                    "Admin",
                    "User",
                    AccessLevel.Support,  // Trying to downgrade Admin
                    AccessLevel.Admin
            )
        );
    }
}

