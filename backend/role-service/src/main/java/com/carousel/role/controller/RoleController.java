package com.carousel.role.controller;

import com.carousel.role.dto.RoleAssignmentDto;
import com.carousel.role.dto.RoleAssignmentRequest;
import com.carousel.role.dto.RoleDto;
import com.carousel.role.service.RoleManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@Tag(name = "Role Management", description = "Role and role-assignment endpoints")
public class RoleController {
    private final RoleManagementService roleService;

    public RoleController(RoleManagementService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    @Operation(summary = "List roles", description = "List all roles from the database")
    public ResponseEntity<List<RoleDto>> getRoles() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    @PostMapping
    @Operation(summary = "Create role", description = "Create new role - Admin only")
    public ResponseEntity<RoleDto> createRole(@RequestBody RoleDto request, @RequestParam String requesterEmail) {
        return ResponseEntity.ok(roleService.createRole(request, requesterEmail));
    }

    @PutMapping("/{roleId}")
    @Operation(summary = "Update role", description = "Update role description - Admin only")
    public ResponseEntity<RoleDto> updateRole(
            @PathVariable String roleId,
            @RequestBody RoleDto request,
            @RequestParam String requesterEmail) {
        return ResponseEntity.ok(roleService.updateRole(roleId, request, requesterEmail));
    }

    @DeleteMapping("/{roleId}")
    @Operation(summary = "Delete role", description = "Delete role - Admin only")
    public ResponseEntity<String> deleteRole(@PathVariable String roleId, @RequestParam String requesterEmail) {
        roleService.deleteRole(roleId, requesterEmail);
        return ResponseEntity.ok("Role deleted successfully");
    }

    @GetMapping("/assignments")
    @Operation(summary = "List role assignments", description = "List role assignments with user and role metadata - Admin only")
    public ResponseEntity<List<RoleAssignmentDto>> getAssignments(@RequestParam String requesterEmail) {
        return ResponseEntity.ok(roleService.getAllAssignments(requesterEmail));
    }

    @PostMapping("/assign")
    @Operation(summary = "Assign role", description = "Assign role to user - Admin only")
    public ResponseEntity<String> assignRole(@RequestBody RoleAssignmentRequest request, @RequestParam String requesterEmail) {
        roleService.assignRole(request, requesterEmail);
        return ResponseEntity.ok("Role assigned successfully");
    }

    @DeleteMapping("/assign")
    @Operation(summary = "Unassign role", description = "Remove role from user - Admin only")
    public ResponseEntity<String> unassignRole(@RequestBody RoleAssignmentRequest request, @RequestParam String requesterEmail) {
        roleService.unassignRole(request, requesterEmail);
        return ResponseEntity.ok("Role unassigned successfully");
    }

    @GetMapping("/user/{email}")
    @Operation(summary = "Get roles by user", description = "Get all roles assigned to a user")
    public ResponseEntity<List<String>> getUserRoles(@PathVariable String email) {
        return ResponseEntity.ok(roleService.getRolesForUser(email));
    }

    @GetMapping("/user/{email}/has/{roleName}")
    @Operation(summary = "Check user role", description = "Check if user has a specific role")
    public ResponseEntity<Boolean> hasRole(@PathVariable String email, @PathVariable String roleName) {
        return ResponseEntity.ok(roleService.userHasRole(email, roleName));
    }

    @PostMapping("/internal/assign-default")
    @Operation(summary = "Assign default role internally", description = "Internal endpoint for assigning default role")
    public ResponseEntity<String> assignDefaultRole(@RequestParam String userEmail) {
        roleService.assignDefaultRoleByEmail(userEmail);
        return ResponseEntity.ok("Default role assigned");
    }
}
