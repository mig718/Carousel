package com.carousel.approval.service;

import com.carousel.approval.client.UserServiceClient;
import com.carousel.approval.domain.ApprovalRequest;
import com.carousel.approval.dto.ApprovalDto;
import com.carousel.approval.repository.ApprovalRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ApprovalService {
    private final ApprovalRequestRepository approvalRequestRepository;
    private final UserServiceClient userServiceClient;

    public ApprovalService(ApprovalRequestRepository approvalRequestRepository, UserServiceClient userServiceClient) {
        this.approvalRequestRepository = approvalRequestRepository;
        this.userServiceClient = userServiceClient;
    }

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void createApprovalRequest(String pendingUserId, String email, String firstName, 
                                     String lastName, String requestedAccessLevel) {
        ApprovalRequest approval = ApprovalRequest.builder()
                .pendingUserId(pendingUserId)
                .email(email)
                .firstName(firstName)
                .lastName(lastName)
                .requestedAccessLevel(requestedAccessLevel)
                .approved(false)
                .createdAt(LocalDateTime.now())
                .build();

        approvalRequestRepository.save(approval);
        sendApprovalNotifications(approval);
    }

    public List<ApprovalDto> getPendingApprovals() {
        return approvalRequestRepository.findByApprovedFalse().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public void approveUser(String approvalId, String approverEmail) {
        ApprovalRequest approval = approvalRequestRepository.findById(approvalId)
                .orElseThrow(() -> new RuntimeException("Approval request not found"));

        approval.setApproved(true);
        approval.setApprovedBy(approverEmail);
        approval.setApprovedAt(LocalDateTime.now());
        approvalRequestRepository.save(approval);

        // Call user service to promote pending user to full user
        userServiceClient.approvePendingUser(approval.getPendingUserId());
    }

    private void sendApprovalNotifications(ApprovalRequest approval) {
        if (mailSender == null) {
            return; // Skip if mail sender not configured
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setSubject("Carousel - New User Approval Required");
        message.setText(String.format(
                "A new user has requested %s access:\n\n" +
                "Name: %s %s\n" +
                "Email: %s\n\n" +
                "Please log in to the system to approve or reject this request.",
                approval.getRequestedAccessLevel(),
                approval.getFirstName(),
                approval.getLastName(),
                approval.getEmail()
        ));

        try {
            // In a real implementation, we would query for all approvers
            // For now, we'll skip sending to specific approvers
            System.out.println("Approval notification prepared for: " + approval.getEmail());
        } catch (Exception e) {
            System.err.println("Failed to send approval notification: " + e.getMessage());
        }
    }

    private ApprovalDto convertToDto(ApprovalRequest approval) {
        return ApprovalDto.builder()
                .id(approval.getId())
                .pendingUserId(approval.getPendingUserId())
                .email(approval.getEmail())
                .firstName(approval.getFirstName())
                .lastName(approval.getLastName())
                .requestedAccessLevel(approval.getRequestedAccessLevel())
                .approved(approval.isApproved())
                .build();
    }
}

