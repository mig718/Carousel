package com.carousel.user.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "pending_users")
public class PendingUser {
    @Id
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private String password; // Store password temporarily until approval
    private AccessLevel requestedAccessLevel;
    private String emailVerificationToken;
    private boolean emailVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PendingUser() {}

    public PendingUser(String id, String firstName, String lastName, String email, String password, AccessLevel requestedAccessLevel, String emailVerificationToken, boolean emailVerified, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.requestedAccessLevel = requestedAccessLevel;
        this.emailVerificationToken = emailVerificationToken;
        this.emailVerified = emailVerified;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public AccessLevel getRequestedAccessLevel() { return requestedAccessLevel; }
    public void setRequestedAccessLevel(AccessLevel requestedAccessLevel) { this.requestedAccessLevel = requestedAccessLevel; }
    public String getEmailVerificationToken() { return emailVerificationToken; }
    public void setEmailVerificationToken(String emailVerificationToken) { this.emailVerificationToken = emailVerificationToken; }
    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static PendingUserBuilder builder() {
        return new PendingUserBuilder();
    }

    public static class PendingUserBuilder {
        private String id;
        private String firstName;
        private String lastName;
        private String email;
        private String password;
        private AccessLevel requestedAccessLevel;
        private String emailVerificationToken;
        private boolean emailVerified;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public PendingUserBuilder id(String id) { this.id = id; return this; }
        public PendingUserBuilder firstName(String firstName) { this.firstName = firstName; return this; }
        public PendingUserBuilder lastName(String lastName) { this.lastName = lastName; return this; }
        public PendingUserBuilder email(String email) { this.email = email; return this; }
        public PendingUserBuilder password(String password) { this.password = password; return this; }
        public PendingUserBuilder requestedAccessLevel(AccessLevel requestedAccessLevel) { this.requestedAccessLevel = requestedAccessLevel; return this; }
        public PendingUserBuilder emailVerificationToken(String emailVerificationToken) { this.emailVerificationToken = emailVerificationToken; return this; }
        public PendingUserBuilder emailVerified(boolean emailVerified) { this.emailVerified = emailVerified; return this; }
        public PendingUserBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public PendingUserBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public PendingUser build() {
            return new PendingUser(id, firstName, lastName, email, password, requestedAccessLevel, emailVerificationToken, emailVerified, createdAt, updatedAt);
        }
    }
}

