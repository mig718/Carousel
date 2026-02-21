package com.carousel.user;

import com.carousel.user.domain.AccessLevel;
import com.carousel.user.domain.User;
import com.carousel.user.repository.PendingUserRepository;
import com.carousel.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
public class UserServiceIntegrationTest {
        private String loginAndGetToken(String email, String password) throws Exception {
                String loginRequest = "{\"email\": \"" + email + "\", \"password\": \"" + password + "\"}";
                String response = mockMvc.perform(post("/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(loginRequest))
                                .andExpect(status().isOk())
                                .andReturn().getResponse().getContentAsString();
                int start = response.indexOf(":\"") + 3;
                int end = response.indexOf("\"");
                return response.substring(start, response.length() - 2).replace("\"}", "");
        }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PendingUserRepository pendingUserRepository;

    private static final String TEST_EMAIL = "integration.user@example.com";
    private static final String TEST_EMAIL_VERIFIED = "verified.user@example.com";

    @BeforeEach
    public void setup() {
        userRepository.deleteAll();
        pendingUserRepository.deleteAll();
        
        // Create verified test user
        User verifiedUser = new User();
        verifiedUser.setFirstName("Verified");
        verifiedUser.setLastName("User");
        verifiedUser.setEmail(TEST_EMAIL_VERIFIED);
        verifiedUser.setAccessLevel(AccessLevel.ReadWrite);
        verifiedUser.setEmailVerified(true);
        verifiedUser.setCreatedAt(LocalDateTime.now());
        verifiedUser.setUpdatedAt(LocalDateTime.now());
        userRepository.save(verifiedUser);
    }

    @Test
    public void testUserRegistrationSuccess() throws Exception {
        String registrationRequest = "{ " +
                "\"email\": \"" + TEST_EMAIL + "\", " +
                "\"firstName\": \"Integration\", " +
                "\"lastName\": \"Test\", " +
                "\"password\": \"SecureTest@123\", " +
                "\"accessLevel\": \"ReadOnly\" " +
                "}";
        
        mockMvc.perform(post("/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registrationRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").exists())
                .andExpect(jsonPath("$.email").value(TEST_EMAIL));
    }

    @Test
    public void testRegistrationDuplicateEmail() throws Exception {
        String registrationRequest = "{ " +
                "\"email\": \"" + TEST_EMAIL_VERIFIED + "\", " +
                "\"firstName\": \"Duplicate\", " +
                "\"lastName\": \"Test\", " +
                "\"password\": \"SecureTest@123\", " +
                "\"accessLevel\": \"ReadOnly\" " +
                "}";
        
        mockMvc.perform(post("/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(registrationRequest))
            .andExpect(status().isBadRequest());
    }

    @Test
    public void testGetUserByEmail() throws Exception {
        mockMvc.perform(get("/email/" + TEST_EMAIL_VERIFIED)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(TEST_EMAIL_VERIFIED))
                .andExpect(jsonPath("$.firstName").value("Verified"));
    }

    @Test
    public void testGetUserByIdNotFound() throws Exception {
        mockMvc.perform(get("/invalidId")
            .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }

    @Test
    public void testGetUsersByAccessLevel() throws Exception {
        mockMvc.perform(get("/access-level/ReadWrite")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    public void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk());
    }

    @Test
    public void testCreateUserDirectlyByAdmin() throws Exception {
        // Create admin user first
        User adminUser = new User();
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setEmail("admin@example.com");
        adminUser.setPassword("adminpass");
        adminUser.setAccessLevel(AccessLevel.Admin);
        adminUser.setEmailVerified(true);
        adminUser.setCreatedAt(LocalDateTime.now());
        adminUser.setUpdatedAt(LocalDateTime.now());
        userRepository.save(adminUser);
        String token = loginAndGetToken("admin@example.com", "adminpass");

        String createRequest = "{ " +
                "\"email\": \"newuser@example.com\", " +
                "\"firstName\": \"New\", " +
                "\"lastName\": \"User\", " +
                "\"accessLevel\": \"Support\" " +
                "}";
        
        mockMvc.perform(post("/admin/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createRequest)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("newuser@example.com"))
                .andExpect(jsonPath("$.accessLevel").value("Support"));
    }

    @Test
    public void testUpdateUserByAdmin() throws Exception {
        // Create admin and regular user
        User adminUser = new User();
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setEmail("admin@example.com");
        adminUser.setPassword("adminpass");
        adminUser.setAccessLevel(AccessLevel.Admin);
        adminUser.setEmailVerified(true);
        adminUser.setCreatedAt(LocalDateTime.now());
        adminUser.setUpdatedAt(LocalDateTime.now());
        adminUser = userRepository.save(adminUser);
        String token = loginAndGetToken("admin@example.com", "adminpass");

        User regularUser = new User();
        regularUser.setFirstName("Regular");
        regularUser.setLastName("User");
        regularUser.setEmail("regular@example.com");
        regularUser.setAccessLevel(AccessLevel.ReadOnly);
        regularUser.setEmailVerified(true);
        regularUser.setCreatedAt(LocalDateTime.now());
        regularUser.setUpdatedAt(LocalDateTime.now());
        regularUser = userRepository.save(regularUser);

        String updateRequest = "{ " +
                "\"firstName\": \"Updated\", " +
                "\"lastName\": \"User\", " +
                "\"accessLevel\": \"ReadWrite\" " +
                "}";
        
        mockMvc.perform(put("/admin/" + regularUser.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateRequest)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Updated"))
                .andExpect(jsonPath("$.accessLevel").value("ReadWrite"));
    }

    @Test
    public void testDeleteUserByAdmin() throws Exception {
        // Create admin and regular user
        User adminUser = new User();
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setEmail("admin@example.com");
        adminUser.setPassword("adminpass");
        adminUser.setAccessLevel(AccessLevel.Admin);
        adminUser.setEmailVerified(true);
        adminUser.setCreatedAt(LocalDateTime.now());
        adminUser.setUpdatedAt(LocalDateTime.now());
        userRepository.save(adminUser);
        String token = loginAndGetToken("admin@example.com", "adminpass");

        User regularUser = new User();
        regularUser.setFirstName("Regular");
        regularUser.setLastName("User");
        regularUser.setEmail("regular@example.com");
        regularUser.setAccessLevel(AccessLevel.ReadOnly);
        regularUser.setEmailVerified(true);
        regularUser.setCreatedAt(LocalDateTime.now());
        regularUser.setUpdatedAt(LocalDateTime.now());
        regularUser = userRepository.save(regularUser);

        mockMvc.perform(delete("/admin/" + regularUser.getId())
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/" + regularUser.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testListAllUsersByAdmin() throws Exception {
        // Create admin user
        User adminUser = new User();
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setEmail("admin@example.com");
        adminUser.setPassword("adminpass");
        adminUser.setAccessLevel(AccessLevel.Admin);
        adminUser.setEmailVerified(true);
        adminUser.setCreatedAt(LocalDateTime.now());
        adminUser.setUpdatedAt(LocalDateTime.now());
        userRepository.save(adminUser);
        String token = loginAndGetToken("admin@example.com", "adminpass");

        mockMvc.perform(get("/admin/all")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].email").exists());
    }

    @Test
    public void testCreateAdminUserBySupport() throws Exception {
        // Create support user
        User supportUser = new User();
        supportUser.setFirstName("Support");
        supportUser.setLastName("User");
        supportUser.setEmail("support@example.com");
        supportUser.setPassword("supportpass");
        supportUser.setAccessLevel(AccessLevel.Support);
        supportUser.setEmailVerified(true);
        supportUser.setCreatedAt(LocalDateTime.now());
        supportUser.setUpdatedAt(LocalDateTime.now());
        userRepository.save(supportUser);
        String token = loginAndGetToken("support@example.com", "supportpass");

        String createRequest = "{ " +
                "\"email\": \"newadmin@example.com\", " +
                "\"firstName\": \"Admin\", " +
                "\"lastName\": \"User\", " +
                "\"accessLevel\": \"Admin\" " +
                "}";
        
        // Support user should not be able to create Admin users
        mockMvc.perform(post("/admin/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createRequest)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}

