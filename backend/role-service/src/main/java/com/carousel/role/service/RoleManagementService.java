package com.carousel.role.service;

import com.carousel.role.client.UserServiceClient;
import com.carousel.role.domain.Role;
import com.carousel.role.domain.UserRoleAssignment;
import com.carousel.role.dto.RoleAssignmentRequest;
import com.carousel.role.dto.RoleDto;
import com.carousel.role.dto.UserDto;
import com.carousel.role.repository.RoleRepository;
import com.carousel.role.repository.UserRoleAssignmentRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class RoleManagementService {
    private final RoleRepository roleRepository;
    private final UserRoleAssignmentRepository assignmentRepository;
    private final UserServiceClient userServiceClient;

    public RoleManagementService(
            RoleRepository roleRepository,
            UserRoleAssignmentRepository assignmentRepository,
            UserServiceClient userServiceClient
    ) {
        this.roleRepository = roleRepository;
        this.assignmentRepository = assignmentRepository;
        this.userServiceClient = userServiceClient;
    }

    @PostConstruct
    public void ensureDefaultRoles() {
        createDefaultRoleIfMissing("Support", "Full access to user management");
        createDefaultRoleIfMissing("ReadOnly", "Read-only access");
        createDefaultRoleIfMissing("PowerUser", "Elevated access to advanced functionality");
        createDefaultRoleIfMissing("InventoryManager", "Manage inventory items and type metadata");
        createDefaultRoleIfMissing("InventoryUser", "Manage inventory items and quantities");
        createDefaultRoleIfMissing("InventoryAdmin", "Inventory administration with type/subtype management");
    }

    private void createDefaultRoleIfMissing(String name, String description) {
        if (!roleRepository.existsByName(name)) {
            roleRepository.save(new Role(null, name, description));
        }
    }

    public List<RoleDto> getAllRoles() {
        return roleRepository.findAll().stream()
                .sorted(Comparator.comparing(Role::getName))
                .map(role -> new RoleDto(role.getName(), role.getDescription()))
                .toList();
    }

    public RoleDto createRole(RoleDto request, String requesterEmail) {
        validateAdmin(requesterEmail);
        if (roleRepository.existsByName(request.getName())) {
            throw new RuntimeException("Role already exists");
        }

        Role saved = roleRepository.save(new Role(null, request.getName(), request.getDescription()));
        return new RoleDto(saved.getName(), saved.getDescription());
    }

    public RoleDto updateRole(String roleName, RoleDto request, String requesterEmail) {
        validateAdmin(requesterEmail);
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        role.setDescription(request.getDescription());
        Role saved = roleRepository.save(role);
        return new RoleDto(saved.getName(), saved.getDescription());
    }

    public void deleteRole(String roleName, String requesterEmail) {
        validateAdmin(requesterEmail);
        if (!roleRepository.existsByName(roleName)) {
            throw new RuntimeException("Role not found");
        }

        roleRepository.deleteByName(roleName);
        assignmentRepository.findAll().forEach(assignment -> {
            List<String> roles = new ArrayList<>(assignment.getRoles());
            if (roles.removeIf(role -> role.equalsIgnoreCase(roleName))) {
                assignment.setRoles(roles);
                assignment.setUpdatedAt(LocalDateTime.now());
                assignmentRepository.save(assignment);
            }
        });
    }

    public void assignRole(RoleAssignmentRequest request, String requesterEmail) {
        validateAdmin(requesterEmail);
        assignRoleInternal(request.getUserEmail(), request.getRoleName());
    }

    public void assignRoleInternal(String userEmail, String roleName) {
        ensureRoleExists(roleName);
        UserRoleAssignment assignment = assignmentRepository.findByUserEmail(userEmail)
                .orElse(new UserRoleAssignment(null, userEmail, new ArrayList<>(), LocalDateTime.now()));

        if (!assignment.getRoles().stream().anyMatch(role -> role.equalsIgnoreCase(roleName))) {
            assignment.getRoles().add(roleName);
            assignment.setUpdatedAt(LocalDateTime.now());
            assignmentRepository.save(assignment);
        }
    }

    public void unassignRole(RoleAssignmentRequest request, String requesterEmail) {
        validateAdmin(requesterEmail);
        UserRoleAssignment assignment = assignmentRepository.findByUserEmail(request.getUserEmail())
                .orElseThrow(() -> new RuntimeException("User role assignment not found"));

        boolean removed = assignment.getRoles().removeIf(role -> role.equalsIgnoreCase(request.getRoleName()));
        if (!removed) {
            throw new RuntimeException("Role is not assigned to user");
        }

        assignment.setUpdatedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);
    }

    public List<String> getRolesForUser(String email) {
        boolean isAdmin = false;
        try {
            UserDto user = userServiceClient.getUserByEmail(email);
            isAdmin = user != null && "Admin".equalsIgnoreCase(user.getAccessLevel());
        } catch (Exception e) {
        }

        UserRoleAssignment assignment = assignmentRepository.findByUserEmail(email)
                .orElse(null);

        if (assignment == null || assignment.getRoles().isEmpty()) {
            if (isAdmin) {
                return List.of("ReadOnly", "Support", "InventoryManager");
            }
            return List.of("ReadOnly");
        }

        List<String> resolved = new ArrayList<>(assignment.getRoles());
        if (isAdmin && resolved.stream().noneMatch(role -> role.equalsIgnoreCase("Support"))) {
            resolved.add("Support");
        }
        if (isAdmin && resolved.stream().noneMatch(role -> role.equalsIgnoreCase("InventoryManager"))) {
            resolved.add("InventoryManager");
        }

        return resolved;
    }

    public boolean userHasRole(String email, String roleName) {
        return getRolesForUser(email).stream().anyMatch(role -> role.equalsIgnoreCase(roleName));
    }

    private void ensureRoleExists(String roleName) {
        if (!roleRepository.existsByName(roleName)) {
            throw new RuntimeException("Role not found");
        }
    }

    private void validateAdmin(String requesterEmail) {
        UserDto user = userServiceClient.getUserByEmail(requesterEmail);
        if (user == null || user.getAccessLevel() == null || !"Admin".equalsIgnoreCase(user.getAccessLevel())) {
            throw new RuntimeException("Only Admin users can manage roles");
        }
    }
}
