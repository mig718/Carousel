package com.carousel.role.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "user_roles")
public class UserRoleAssignment {
    @Id
    private String id;
    private String userEmail;
    private List<String> roles = new ArrayList<>();
    private LocalDateTime updatedAt;

    public UserRoleAssignment() {
    }

    public UserRoleAssignment(String id, String userEmail, List<String> roles, LocalDateTime updatedAt) {
        this.id = id;
        this.userEmail = userEmail;
        this.roles = roles;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
