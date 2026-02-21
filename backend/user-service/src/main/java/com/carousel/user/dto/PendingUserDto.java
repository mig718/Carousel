package com.carousel.user.dto;

import com.carousel.user.domain.AccessLevel;

import java.time.LocalDateTime;

public class PendingUserDto {
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private AccessLevel requestedAccessLevel;
    private boolean emailVerified;
    private LocalDateTime createdAt;

    public PendingUserDto() {}

    public PendingUserDto(String id, String firstName, String lastName, String email, AccessLevel requestedAccessLevel, boolean emailVerified, LocalDateTime createdAt) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.requestedAccessLevel = requestedAccessLevel;
        this.emailVerified = emailVerified;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public AccessLevel getRequestedAccessLevel() {
        return requestedAccessLevel;
    }

    public void setRequestedAccessLevel(AccessLevel requestedAccessLevel) {
        this.requestedAccessLevel = requestedAccessLevel;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static PendingUserDtoBuilder builder() {
        return new PendingUserDtoBuilder();
    }

    public static class PendingUserDtoBuilder {
        private String id;
        private String firstName;
        private String lastName;
        private String email;
        private AccessLevel requestedAccessLevel;
        private boolean emailVerified;
        private LocalDateTime createdAt;

        public PendingUserDtoBuilder id(String id) {
            this.id = id;
            return this;
        }

        public PendingUserDtoBuilder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public PendingUserDtoBuilder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public PendingUserDtoBuilder email(String email) {
            this.email = email;
            return this;
        }

        public PendingUserDtoBuilder requestedAccessLevel(AccessLevel requestedAccessLevel) {
            this.requestedAccessLevel = requestedAccessLevel;
            return this;
        }

        public PendingUserDtoBuilder emailVerified(boolean emailVerified) {
            this.emailVerified = emailVerified;
            return this;
        }

        public PendingUserDtoBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public PendingUserDto build() {
            return new PendingUserDto(id, firstName, lastName, email, requestedAccessLevel, emailVerified, createdAt);
        }
    }
}

