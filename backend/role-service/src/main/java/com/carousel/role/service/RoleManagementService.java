package com.carousel.role.service;

import com.carousel.role.client.UserServiceClient;
import com.carousel.role.config.PredefinedRolesConfig;
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
import java.util.stream.Stream;

@Service
public class RoleManagementService {
    private final RoleRepository roleRepository;
    private final UserRoleAssignmentRepository assignmentRepository;
    private final UserServiceClient userServiceClient;
    private final PredefinedRolesConfig predefinedRolesConfig;

    public RoleManagementService(
            RoleRepository roleRepository,
            UserRoleAssignmentRepository assignmentRepository,
            UserServiceClient userServiceClient,
            PredefinedRolesConfig predefinedRolesConfig
    ) {
        this.roleRepository = roleRepository;
        this.assignmentRepository = assignmentRepository;
        this.userServiceClient = userServiceClient;
        this.predefinedRolesConfig = predefinedRolesConfig;
    }

    @PostConstruct
    public void ensureDefaultRoles() {
        // Clean up predefined roles from database if they exist
        // (they should not be in the database anymore)
        List<String> predefinedNames = predefinedRolesConfig.getPredefined().stream()
                .map(RoleDto::getName)
                .toList();
        
        predefinedNames.forEach(name -> {
            if (roleRepository.existsByName(name)) {
                roleRepository.deleteByName(name);
            }
        });
    }

    public List<RoleDto> getAllRoles() {
        // Combine predefined roles and custom roles from database
        List<RoleDto> predefined = new ArrayList<>(predefinedRolesConfig.getPredefined());
        List<RoleDto> custom = roleRepository.findAll().stream()
                .sorted(Comparator.comparing(Role::getName))
                .map(role -> new RoleDto(role.getName(), role.getDescription()))
                .toList();
        
        return Stream.concat(predefined.stream(), custom.stream())
                .sorted(Comparator.comparing(RoleDto::getName))
                .toList();
    }

    public List<RoleDto> getCustomRoles() {
        // Return only custom roles from database
        return roleRepository.findAll().stream()
                .sorted(Comparator.comparing(Role::getName))
                .map(role -> new RoleDto(role.getName(), role.getDescription()))
                .toList();
    }

    public RoleDto createRole(RoleDto request, String requesterEmail) {
        validateAdmin(requesterEmail);
        
        // Check if role name conflicts with predefined roles
        boolean isPredefined = predefinedRolesConfig.getPredefined().stream()
                .anyMatch(role -> role.getName().equalsIgnoreCase(request.getName()));
        if (isPredefined) {
            throw new RuntimeException("Cannot create custom role with predefined role name");
        }
        
        if (roleRepository.existsByName(request.getName())) {
            throw new RuntimeException("Role already exists");
        }

        Role saved = roleRepository.save(new Role(null, request.getName(), request.getDescription()));
        return new RoleDto(saved.getName(), saved.getDescription());
    }

    public RoleDto updateRole(String roleName, RoleDto request, String requesterEmail) {
        validateAdmin(requesterEmail);
        
        // Check if trying to update a predefined role
        boolean isPredefined = predefinedRolesConfig.getPredefined().stream()
                .anyMatch(role -> role.getName().equalsIgnoreCase(roleName));
        if (isPredefined) {
            throw new RuntimeException("Cannot update predefined role");
        }
        
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        role.setDescription(request.getDescription());
        Role saved = roleRepository.save(role);
        return new RoleDto(saved.getName(), saved.getDescription());
    }

    public void deleteRole(String roleName, String requesterEmail) {
        validateAdmin(requesterEmail);
        
        // Check if trying to delete a predefined role
        boolean isPredefined = predefinedRolesConfig.getPredefined().stream()
                .anyMatch(role -> role.getName().equalsIgnoreCase(roleName));
        if (isPredefined) {
            throw new RuntimeException("Cannot delete predefined role");
        }
        
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
        // Check both predefined and custom roles
        boolean isPredefined = predefinedRolesConfig.getPredefined().stream()
                .anyMatch(role -> role.getName().equalsIgnoreCase(roleName));
        boolean isCustom = roleRepository.existsByName(roleName);
        
        if (!isPredefined && !isCustom) {
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
