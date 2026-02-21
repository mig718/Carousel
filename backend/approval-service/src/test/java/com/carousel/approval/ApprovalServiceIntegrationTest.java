package com.carousel.approval;

import com.carousel.approval.repository.ApprovalRequestRepository;
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
public class ApprovalServiceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ApprovalRequestRepository approvalRequestRepository;

    @BeforeEach
    public void setup() {
        approvalRequestRepository.deleteAll();
    }

    @Test
    public void testCreateApprovalRequest() throws Exception {
        String approvalRequest = "{ " +
                "\"pendingUserId\": \"testPendingId\", " +
                "\"email\": \"pending.user@example.com\", " +
                "\"firstName\": \"Pending\", " +
                "\"lastName\": \"User\", " +
                "\"requestedAccessLevel\": \"ReadWrite\" " +
                "}";
        
        mockMvc.perform(post("/request")
                .contentType(MediaType.APPLICATION_JSON)
                .content(approvalRequest))
                .andExpect(status().isOk());
    }

    @Test
    public void testGetPendingApprovals() throws Exception {
        mockMvc.perform(get("/pending")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    public void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk());
    }
}

