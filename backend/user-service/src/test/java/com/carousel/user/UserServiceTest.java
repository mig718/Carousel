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
                .accessLevel(AccessLevel.User)
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
                .accessLevel(AccessLevel.Admin)
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
                .accessLevel(AccessLevel.User)
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
                .accessLevel(AccessLevel.User)
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
                .accessLevel(AccessLevel.Admin)
                .build();

        var response = userService.register(request);
        var pendingUser = pendingUserRepository.findByEmail("john@example.com").get();
        
        // Verify email first
        userService.verifyEmail(pendingUser.getEmailVerificationToken());
        
        // Approve user
        userService.approvePendingUser(pendingUser.getId());
        
        var user = userRepository.findByEmail("john@example.com");
        assertTrue(user.isPresent());
        assertEquals(AccessLevel.Admin, user.get().getAccessLevel());
        
        var stillPending = pendingUserRepository.findByEmail("john@example.com");
        assertFalse(stillPending.isPresent());
    }

    @Test
    public void testInvalidEmailVerificationToken() {
        assertThrows(RuntimeException.class, () -> 
            userService.verifyEmail("invalid-token")
        );
    }

    @Test
    public void testCreateUserDirectlyByAdmin() {
        // Create an admin user first
        User adminUser = new User();
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setEmail("admin@example.com");
        adminUser.setPassword("password");
        adminUser.setAccessLevel(AccessLevel.Admin);
        adminUser.setEmailVerified(true);
        userRepository.save(adminUser);
        
        // Now create a regular user as admin
        var userDto = userService.createUserDirectly(
                "User",
                "User",
                "support@example.com",
                AccessLevel.User,
                "admin@example.com"  // requester email (admin)
        );
        
        assertNotNull(userDto);
        assertEquals("support@example.com", userDto.getEmail());
        assertEquals(AccessLevel.User, userDto.getAccessLevel());
    }

    @Test
    public void testCreateUserDirectlyAsNonAdmin() {
        // Create a regular (non-admin) user first
        User regularUser = new User();
        regularUser.setFirstName("Regular");
        regularUser.setLastName("User");
        regularUser.setEmail("regular@example.com");
        regularUser.setPassword("password");
        regularUser.setAccessLevel(AccessLevel.User);
        regularUser.setEmailVerified(true);
        userRepository.save(regularUser);
        
        // Try to create a user as non-admin - should throw exception
        assertThrows(Exception.class, () -> 
            userService.createUserDirectly(
                    "NewUser",
                    "NewLast",
                    "newuser@example.com",
                    AccessLevel.User,
                    "regular@example.com"  // requester is not admin
            )
        );
    }

    @Test
    public void testUpdateUserByAdmin() {
        // Create admin
        User adminUser = new User();
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setEmail("admin@example.com");
        adminUser.setPassword("password");
        adminUser.setAccessLevel(AccessLevel.Admin);
        adminUser.setEmailVerified(true);
        userRepository.save(adminUser);
        
        // Create initial user
        var initialUserDto = userService.createUserDirectly(
                "John",
                "Doe",
                "john@example.com",
                AccessLevel.User,
                "admin@example.com"
        );

        // Update user
        var updatedUserDto = userService.updateUser(
                initialUserDto.getId(),
                "Jane",
                "Smith",
                AccessLevel.Admin,
                "admin@example.com"
        );

        assertEquals("Jane", updatedUserDto.getFirstName());
        assertEquals("Smith", updatedUserDto.getLastName());
        assertEquals(AccessLevel.Admin, updatedUserDto.getAccessLevel());
    }

    @Test
    public void testUpdateUserAsNonAdmin() {
        // Create admin for setup
        User adminUser = new User();
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setEmail("admin@example.com");
        adminUser.setPassword("password");
        adminUser.setAccessLevel(AccessLevel.Admin);
        adminUser.setEmailVerified(true);
        userRepository.save(adminUser);
        
        // Create initial user
        var initialUserDto = userService.createUserDirectly(
                "John",
                "Doe",
                "john@example.com",
                AccessLevel.User,
                "admin@example.com"
        );

        // Create non-admin
        User regularUser = new User();
        regularUser.setFirstName("Regular");
        regularUser.setLastName("User");
        regularUser.setEmail("regular@example.com");
        regularUser.setPassword("password");
        regularUser.setAccessLevel(AccessLevel.User);
        regularUser.setEmailVerified(true);
        userRepository.save(regularUser);

        // Try to update as non-admin should fail
        assertThrows(Exception.class, () ->
            userService.updateUser(
                    initialUserDto.getId(),
                    "Jane",
                    "Smith",
                    AccessLevel.User,
                    "regular@example.com"  // non-admin requester
            )
        );
    }

    @Test
    public void testDeleteUserByAdmin() {
        // Create admin
        User adminUser = new User();
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setEmail("admin@example.com");
        adminUser.setPassword("password");
        adminUser.setAccessLevel(AccessLevel.Admin);
        adminUser.setEmailVerified(true);
        userRepository.save(adminUser);
        
        // Create user to delete
        var userDto = userService.createUserDirectly(
                "John",
                "Doe",
                "john@example.com",
                AccessLevel.User,
                "admin@example.com"
        );

        userService.deleteUser(userDto.getId(), "admin@example.com");

        assertFalse(userRepository.findById(userDto.getId()).isPresent());
    }

    @Test
    public void testDeleteUserAsNonAdmin() {
        // Create admin for setup
        User adminUser = new User();
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setEmail("admin@example.com");
        adminUser.setPassword("password");
        adminUser.setAccessLevel(AccessLevel.Admin);
        adminUser.setEmailVerified(true);
        userRepository.save(adminUser);
        
        // Create user
        var userDto = userService.createUserDirectly(
                "John",
                "Doe",
                "john@example.com",
                AccessLevel.User,
                "admin@example.com"
        );

        // Create non-admin
        User regularUser = new User();
        regularUser.setFirstName("Regular");
        regularUser.setLastName("User");
        regularUser.setEmail("regular@example.com");
        regularUser.setPassword("password");
        regularUser.setAccessLevel(AccessLevel.User);
        regularUser.setEmailVerified(true);
        userRepository.save(regularUser);

        // Try to delete as non-admin should fail
        assertThrows(Exception.class, () ->
            userService.deleteUser(userDto.getId(), "regular@example.com")
        );
    }

    @Test
    public void testGetAllUsersByAdmin() {
        // Create admin
        User adminUser = new User();
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setEmail("admin@example.com");
        adminUser.setPassword("password");
        adminUser.setAccessLevel(AccessLevel.Admin);
        adminUser.setEmailVerified(true);
        userRepository.save(adminUser);
        
        // Create multiple users
        userService.createUserDirectly("User1", "Last1", "user1@example.com", AccessLevel.User, "admin@example.com");
        userService.createUserDirectly("User2", "Last2", "user2@example.com", AccessLevel.User, "admin@example.com");
        
        var users = userService.getAllUsers("admin@example.com");
        assertEquals(3, users.size());  // admin + 2 users
    }

    @Test
    public void testGetAllUsersAsNonAdmin() {
        // Create non-admin user
        User regularUser = new User();
        regularUser.setFirstName("Regular");
        regularUser.setLastName("User");
        regularUser.setEmail("regular@example.com");
        regularUser.setPassword("password");
        regularUser.setAccessLevel(AccessLevel.User);
        regularUser.setEmailVerified(true);
        userRepository.save(regularUser);
        
        // Try to get all users as non-admin should fail
        assertThrows(Exception.class, () ->
            userService.getAllUsers("regular@example.com")
        );
    }
}

