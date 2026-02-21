package com.carousel.auth.dto;

public class ValidateTokenRequest {
    private String token;
    private String email;

    public ValidateTokenRequest() {
    }

    public ValidateTokenRequest(String token, String email) {
        this.token = token;
        this.email = email;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public static ValidateTokenRequestBuilder builder() {
        return new ValidateTokenRequestBuilder();
    }

    public static class ValidateTokenRequestBuilder {
        private String token;
        private String email;

        public ValidateTokenRequestBuilder token(String token) {
            this.token = token;
            return this;
        }

        public ValidateTokenRequestBuilder email(String email) {
            this.email = email;
            return this;
        }

        public ValidateTokenRequest build() {
            return new ValidateTokenRequest(token, email);
        }
    }
}

