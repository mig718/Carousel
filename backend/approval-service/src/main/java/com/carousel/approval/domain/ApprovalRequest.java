package com.carousel.approval.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "approvals")
public class ApprovalRequest {
    @Id
    private String id;
    private String pendingUserId;
    private String email;
    private String firstName;
    private String lastName;
    private String requestedAccessLevel;
    private boolean approved;
    private String approvedBy;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;

    public ApprovalRequest() {}

    public ApprovalRequest(String id, String pendingUserId, String email, String firstName, String lastName, String requestedAccessLevel, boolean approved, String approvedBy, LocalDateTime createdAt, LocalDateTime approvedAt) {
        this.id = id;
        this.pendingUserId = pendingUserId;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.requestedAccessLevel = requestedAccessLevel;
        this.approved = approved;
        this.approvedBy = approvedBy;
        this.createdAt = createdAt;
        this.approvedAt = approvedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPendingUserId() { return pendingUserId; }
    public void setPendingUserId(String pendingUserId) { this.pendingUserId = pendingUserId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getRequestedAccessLevel() { return requestedAccessLevel; }
    public void setRequestedAccessLevel(String requestedAccessLevel) { this.requestedAccessLevel = requestedAccessLevel; }
    public boolean isApproved() { return approved; }
    public void setApproved(boolean approved) { this.approved = approved; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }

    public static ApprovalRequestBuilder builder() {
        return new ApprovalRequestBuilder();
    }

    public static class ApprovalRequestBuilder {
        private String id;
        private String pendingUserId;
        private String email;
        private String firstName;
        private String lastName;
        private String requestedAccessLevel;
        private boolean approved;
        private String approvedBy;
        private LocalDateTime createdAt;
        private LocalDateTime approvedAt;

        public ApprovalRequestBuilder id(String id) { this.id = id; return this; }
        public ApprovalRequestBuilder pendingUserId(String pendingUserId) { this.pendingUserId = pendingUserId; return this; }
        public ApprovalRequestBuilder email(String email) { this.email = email; return this; }
        public ApprovalRequestBuilder firstName(String firstName) { this.firstName = firstName; return this; }
        public ApprovalRequestBuilder lastName(String lastName) { this.lastName = lastName; return this; }
        public ApprovalRequestBuilder requestedAccessLevel(String requestedAccessLevel) { this.requestedAccessLevel = requestedAccessLevel; return this; }
        public ApprovalRequestBuilder approved(boolean approved) { this.approved = approved; return this; }
        public ApprovalRequestBuilder approvedBy(String approvedBy) { this.approvedBy = approvedBy; return this; }
        public ApprovalRequestBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public ApprovalRequestBuilder approvedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; return this; }

        public ApprovalRequest build() {
            return new ApprovalRequest(id, pendingUserId, email, firstName, lastName, requestedAccessLevel, approved, approvedBy, createdAt, approvedAt);
        }
    }
}

