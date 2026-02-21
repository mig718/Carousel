package com.carousel.user.dto;

import com.carousel.user.domain.AccessLevel;

public class DirectUserCreationRequest {
    private String firstName;
    private String lastName;
    private String email;
    private AccessLevel accessLevel;

    public DirectUserCreationRequest() {}

    public DirectUserCreationRequest(String firstName, String lastName, String email, AccessLevel accessLevel) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.accessLevel = accessLevel;
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

    public AccessLevel getAccessLevel() {
        return accessLevel;
    }

    public void setAccessLevel(AccessLevel accessLevel) {
        this.accessLevel = accessLevel;
    }
}

