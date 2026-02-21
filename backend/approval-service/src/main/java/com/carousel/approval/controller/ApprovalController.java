package com.carousel.approval.controller;

import com.carousel.approval.dto.ApprovalDto;
import com.carousel.approval.dto.CreateApprovalRequest;
import com.carousel.approval.service.ApprovalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@Tag(name = "User Approvals", description = "User approval workflow endpoints")
public class ApprovalController {
    private final ApprovalService approvalService;

    public ApprovalController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @PostMapping("/request")
    @Operation(summary = "Create approval request", description = "Create a new approval request for a pending user")
    public ResponseEntity<String> createApprovalRequest(@RequestBody CreateApprovalRequest request) {
        approvalService.createApprovalRequest(
                request.getPendingUserId(),
                request.getEmail(),
                request.getFirstName(),
                request.getLastName(),
                request.getRequestedAccessLevel()
        );
        return ResponseEntity.ok("Approval request created and notifications sent");
    }

    @GetMapping("/pending")
    @Operation(summary = "Get pending approvals", description = "Get list of all pending approval requests")
    public ResponseEntity<List<ApprovalDto>> getPendingApprovals() {
        return ResponseEntity.ok(approvalService.getPendingApprovals());
    }

    @PostMapping("/{approvalId}/approve")
    @Operation(summary = "Approve user", description = "Approve a pending user request")
    public ResponseEntity<String> approveUser(@PathVariable String approvalId, 
                                             @RequestParam String approverEmail) {
        approvalService.approveUser(approvalId, approverEmail);
        return ResponseEntity.ok("User approved successfully");
    }
}

