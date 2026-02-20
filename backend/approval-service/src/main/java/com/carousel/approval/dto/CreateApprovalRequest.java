package com.carousel.approval.dto;

public class CreateApprovalRequest {
    private String pendingUserId;
    private String email;
    private String firstName;
    private String lastName;
    private String requestedAccessLevel;

    public CreateApprovalRequest() {}

    public CreateApprovalRequest(String pendingUserId, String email, String firstName, String lastName, String requestedAccessLevel) {
        this.pendingUserId = pendingUserId;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.requestedAccessLevel = requestedAccessLevel;
    }

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

    public static CreateApprovalRequestBuilder builder() {
        return new CreateApprovalRequestBuilder();
    }

    public static class CreateApprovalRequestBuilder {
        private String pendingUserId;
        private String email;
        private String firstName;
        private String lastName;
        private String requestedAccessLevel;

        public CreateApprovalRequestBuilder pendingUserId(String pendingUserId) { this.pendingUserId = pendingUserId; return this; }
        public CreateApprovalRequestBuilder email(String email) { this.email = email; return this; }
        public CreateApprovalRequestBuilder firstName(String firstName) { this.firstName = firstName; return this; }
        public CreateApprovalRequestBuilder lastName(String lastName) { this.lastName = lastName; return this; }
        public CreateApprovalRequestBuilder requestedAccessLevel(String requestedAccessLevel) { this.requestedAccessLevel = requestedAccessLevel; return this; }

        public CreateApprovalRequest build() {
            return new CreateApprovalRequest(pendingUserId, email, firstName, lastName, requestedAccessLevel);
        }
    }
}

