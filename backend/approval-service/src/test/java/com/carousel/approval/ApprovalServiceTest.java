package com.carousel.approval;

import com.carousel.approval.domain.ApprovalRequest;
import com.carousel.approval.repository.ApprovalRequestRepository;
import com.carousel.approval.service.ApprovalService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class ApprovalServiceTest {
    
    @Autowired
    private ApprovalService approvalService;
    
    @Autowired
    private ApprovalRequestRepository approvalRequestRepository;

    @BeforeEach
    public void setUp() {
        approvalRequestRepository.deleteAll();
    }

    @Test
    public void testCreateApprovalRequest() {
        approvalService.createApprovalRequest(
                "pending-user-1",
                "jane@example.com",
                "Jane",
                "Doe",
                "ReadWrite"
        );

        var pending = approvalRequestRepository.findByPendingUserId("pending-user-1");
        assertTrue(pending.isPresent());
        assertEquals("jane@example.com", pending.get().getEmail());
        assertFalse(pending.get().isApproved());
    }

    @Test
    public void testGetPendingApprovals() {
        approvalService.createApprovalRequest(
                "pending-user-1",
                "jane@example.com",
                "Jane",
                "Doe",
                "ReadWrite"
        );
        
        approvalService.createApprovalRequest(
                "pending-user-2",
                "bob@example.com",
                "Bob",
                "Smith",
                "Admin"
        );

        var pending = approvalService.getPendingApprovals();
        assertEquals(2, pending.size());
    }

    @Test
    public void testApprovalRequestCannotBeFoundWithInvalidId() {
        assertThrows(RuntimeException.class, () -> 
            approvalService.approveUser("invalid-id", "approver@example.com")
        );
    }
}

