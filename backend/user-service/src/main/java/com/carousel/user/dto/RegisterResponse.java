package com.carousel.user.dto;

import com.carousel.user.domain.AccessLevel;

public class RegisterResponse {
    private String userId;
    private String email;
    private String message;
    private boolean requiresApproval;

    public RegisterResponse() {}

    public RegisterResponse(String userId, String email, String message, boolean requiresApproval) {
        this.userId = userId;
        this.email = email;
        this.message = message;
        this.requiresApproval = requiresApproval;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isRequiresApproval() {
        return requiresApproval;
    }

    public void setRequiresApproval(boolean requiresApproval) {
        this.requiresApproval = requiresApproval;
    }

    public static RegisterResponseBuilder builder() {
        return new RegisterResponseBuilder();
    }

    public static class RegisterResponseBuilder {
        private String userId;
        private String email;
        private String message;
        private boolean requiresApproval;

        public RegisterResponseBuilder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public RegisterResponseBuilder email(String email) {
            this.email = email;
            return this;
        }

        public RegisterResponseBuilder message(String message) {
            this.message = message;
            return this;
        }

        public RegisterResponseBuilder requiresApproval(boolean requiresApproval) {
            this.requiresApproval = requiresApproval;
            return this;
        }

        public RegisterResponse build() {
            return new RegisterResponse(userId, email, message, requiresApproval);
        }
    }
}

