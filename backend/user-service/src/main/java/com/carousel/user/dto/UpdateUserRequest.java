package com.carousel.user.dto;

import com.carousel.user.domain.AccessLevel;

public class UpdateUserRequest {
    private String firstName;
    private String lastName;
    private AccessLevel accessLevel;

    public UpdateUserRequest() {}

    public UpdateUserRequest(String firstName, String lastName, AccessLevel accessLevel) {
        this.firstName = firstName;
        this.lastName = lastName;
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

    public AccessLevel getAccessLevel() {
        return accessLevel;
    }

    public void setAccessLevel(AccessLevel accessLevel) {
        this.accessLevel = accessLevel;
    }
}

