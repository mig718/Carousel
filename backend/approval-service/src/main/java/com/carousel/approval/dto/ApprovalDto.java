package com.carousel.approval.dto;

public class ApprovalDto {
    private String id;
    private String pendingUserId;
    private String targetUserId;
    private String email;
    private String firstName;
    private String lastName;
    private String requestedAccessLevel;
    private String requestType;
    private java.time.LocalDateTime createdAt;
    private boolean approved;

    public ApprovalDto() {}

    public ApprovalDto(String id, String pendingUserId, String targetUserId, String email, String firstName, String lastName, String requestedAccessLevel, String requestType, java.time.LocalDateTime createdAt, boolean approved) {
        this.id = id;
        this.pendingUserId = pendingUserId;
        this.targetUserId = targetUserId;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.requestedAccessLevel = requestedAccessLevel;
        this.requestType = requestType;
        this.createdAt = createdAt;
        this.approved = approved;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPendingUserId() {
        return pendingUserId;
    }

    public void setPendingUserId(String pendingUserId) {
        this.pendingUserId = pendingUserId;
    }

    public String getTargetUserId() {
        return targetUserId;
    }

    public void setTargetUserId(String targetUserId) {
        this.targetUserId = targetUserId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getRequestedAccessLevel() {
        return requestedAccessLevel;
    }

    public void setRequestedAccessLevel(String requestedAccessLevel) {
        this.requestedAccessLevel = requestedAccessLevel;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isApproved() {
        return approved;
    }

    public void setApproved(boolean approved) {
        this.approved = approved;
    }

    public static ApprovalDtoBuilder builder() {
        return new ApprovalDtoBuilder();
    }

    public static class ApprovalDtoBuilder {
        private String id;
        private String pendingUserId;
        private String targetUserId;
        private String email;
        private String firstName;
        private String lastName;
        private String requestedAccessLevel;
        private String requestType;
        private java.time.LocalDateTime createdAt;
        private boolean approved;

        public ApprovalDtoBuilder id(String id) {
            this.id = id;
            return this;
        }

        public ApprovalDtoBuilder pendingUserId(String pendingUserId) {
            this.pendingUserId = pendingUserId;
            return this;
        }

        public ApprovalDtoBuilder targetUserId(String targetUserId) {
            this.targetUserId = targetUserId;
            return this;
        }

        public ApprovalDtoBuilder email(String email) {
            this.email = email;
            return this;
        }

        public ApprovalDtoBuilder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public ApprovalDtoBuilder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public ApprovalDtoBuilder requestedAccessLevel(String requestedAccessLevel) {
            this.requestedAccessLevel = requestedAccessLevel;
            return this;
        }

        public ApprovalDtoBuilder requestType(String requestType) {
            this.requestType = requestType;
            return this;
        }

        public ApprovalDtoBuilder createdAt(java.time.LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public ApprovalDtoBuilder approved(boolean approved) {
            this.approved = approved;
            return this;
        }

        public ApprovalDto build() {
            return new ApprovalDto(id, pendingUserId, targetUserId, email, firstName, lastName, requestedAccessLevel, requestType, createdAt, approved);
        }
    }
}

