package com.carousel.auth;

import com.carousel.auth.domain.Credential;
import com.carousel.auth.repository.CredentialRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.codec.digest.DigestUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
public class AuthServiceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CredentialRepository credentialRepository;

    private static final String TEST_EMAIL = "integration.test@example.com";
    private static final String TEST_PASSWORD = "IntegrationTest@123";

    @BeforeEach
    public void setup() {
        credentialRepository.deleteAll();
        
        // Create test credential
        Credential credential = new Credential();
        credential.setEmail(TEST_EMAIL);
        credential.setPasswordHash(DigestUtils.sha256Hex(TEST_PASSWORD));
        credential.setCreatedAt(LocalDateTime.now());
        credential.setUpdatedAt(LocalDateTime.now());
        credentialRepository.save(credential);
    }

    @Test
    public void testLoginSuccess() throws Exception {
        String loginRequest = "{ \"email\": \"" + TEST_EMAIL + "\", \"password\": \"" + TEST_PASSWORD + "\" }";
        
        mockMvc.perform(post("/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.email").value(TEST_EMAIL));
    }

    @Test
    public void testLoginFailsWithWrongPassword() throws Exception {
        String loginRequest = "{ \"email\": \"" + TEST_EMAIL + "\", \"password\": \"WrongPassword123\" }";
        
        mockMvc.perform(post("/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginRequest))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testLoginFailsWithNonExistentUser() throws Exception {
        String loginRequest = "{ \"email\": \"nonexistent@example.com\", \"password\": \"" + TEST_PASSWORD + "\" }";
        
            mockMvc.perform(post("/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginRequest))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testValidateToken() throws Exception {
        // First login to get token
        String loginRequest = "{ \"email\": \"" + TEST_EMAIL + "\", \"password\": \"" + TEST_PASSWORD + "\" }";
        String loginResponse = mockMvc.perform(post("/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginRequest))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode loginJson = objectMapper.readTree(loginResponse);
        String token = loginJson.get("token").asText();

        String validateRequest = "{ \"email\": \"" + TEST_EMAIL + "\", \"token\": \"" + token + "\" }";
        mockMvc.perform(post("/validate")
            .contentType(MediaType.APPLICATION_JSON)
            .content(validateRequest))
            .andExpect(status().isOk())
            .andExpect(content().string("true"));
    }

    @Test
    public void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk());
    }
}

