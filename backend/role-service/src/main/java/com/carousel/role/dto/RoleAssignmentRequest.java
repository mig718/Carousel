package com.carousel.role.dto;

public class RoleAssignmentRequest {
    private String userEmail;
    private String roleName;

    public RoleAssignmentRequest() {
    }

    public RoleAssignmentRequest(String userEmail, String roleName) {
        this.userEmail = userEmail;
        this.roleName = roleName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }
}
