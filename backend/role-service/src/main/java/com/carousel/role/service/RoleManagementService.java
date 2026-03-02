package com.carousel.role.service;

import com.carousel.role.client.UserServiceClient;
import com.carousel.role.domain.Role;
import com.carousel.role.domain.UserRoleAssignment;
import com.carousel.role.dto.RoleAssignmentDto;
import com.carousel.role.dto.RoleAssignmentRequest;
import com.carousel.role.dto.RoleDto;
import com.carousel.role.dto.UserDto;
import com.carousel.role.repository.RoleRepository;
import com.carousel.role.repository.UserRoleAssignmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
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

    @Transactional(readOnly = true)
    public List<RoleDto> getAllRoles() {
        return roleRepository.findAll().stream()
                .sorted(Comparator.comparing(Role::getName))
                .map(this::toRoleDto)
                .toList();
    }

    public RoleDto createRole(RoleDto request, String requesterEmail) {
        validateAdmin(requesterEmail);
        validateRoleRequest(request);

        if (roleRepository.existsByNameIgnoreCase(request.getName())) {
            throw new RuntimeException("Role already exists");
        }

        Role saved = roleRepository.save(new Role(null, request.getName().trim(), request.getDescription().trim(), true));
        return toRoleDto(saved);
    }

    public RoleDto updateRole(String roleId, RoleDto request, String requesterEmail) {
        validateAdmin(requesterEmail);
        validateRoleRequest(request);

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        if (!role.isEditable()) {
            throw new RuntimeException("Cannot update predefined role");
        }

        Optional<Role> conflict = roleRepository.findByNameIgnoreCase(request.getName().trim());
        if (conflict.isPresent() && !conflict.get().getId().equals(roleId)) {
            throw new RuntimeException("Role name already exists");
        }

        role.setName(request.getName().trim());
        role.setDescription(request.getDescription().trim());
        Role saved = roleRepository.save(role);
        return toRoleDto(saved);
    }

    public void deleteRole(String roleId, String requesterEmail) {
        validateAdmin(requesterEmail);

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        if (!role.isEditable()) {
            throw new RuntimeException("Cannot delete predefined role");
        }

        assignmentRepository.deleteByRoleId(roleId);
        roleRepository.delete(role);
    }

    public void assignRole(RoleAssignmentRequest request, String requesterEmail) {
        validateAdmin(requesterEmail);
        String resolvedUserId = resolveUserId(request);
        String resolvedRoleId = resolveRoleId(request);
        assignRoleInternal(resolvedUserId, resolvedRoleId);
    }

    public void assignRoleInternal(String userId, String roleId) {
        ensureRoleExistsById(roleId);
        ensureUserExistsById(userId);

        Optional<UserRoleAssignment> existing = assignmentRepository.findByUserIdAndRoleId(userId, roleId);
        if (existing.isEmpty()) {
            UserRoleAssignment assignment = new UserRoleAssignment(null, userId, roleId, LocalDateTime.now());
            assignmentRepository.save(assignment);
        }
    }

    public void unassignRole(RoleAssignmentRequest request, String requesterEmail) {
        validateAdmin(requesterEmail);
        String resolvedUserId = resolveUserId(request);
        String resolvedRoleId = resolveRoleId(request);
        UserRoleAssignment assignment = assignmentRepository
            .findByUserIdAndRoleId(resolvedUserId, resolvedRoleId)
                .orElseThrow(() -> new RuntimeException("User role assignment not found"));

        assignmentRepository.delete(assignment);
    }

    @Transactional(readOnly = true)
    public List<RoleAssignmentDto> getAllAssignments(String requesterEmail) {
        validateAdmin(requesterEmail);

        List<UserDto> users = userServiceClient.getAllUsers(requesterEmail);
        Map<String, UserDto> userById = users.stream().collect(Collectors.toMap(UserDto::getId, user -> user, (first, second) -> first));

        Map<String, Role> roleById = roleRepository.findAll().stream()
                .collect(Collectors.toMap(Role::getId, role -> role, (first, second) -> first));

        return assignmentRepository.findAll().stream()
                .map(assignment -> {
                    UserDto user = userById.get(assignment.getUserId());
                    Role role = roleById.get(assignment.getRoleId());
                    String userName = user == null
                            ? "Unknown User"
                            : (safeValue(user.getFirstName()) + " " + safeValue(user.getLastName())).trim();
                    if (userName.isBlank()) {
                        userName = user == null ? "Unknown User" : safeValue(user.getEmail());
                    }
                    return new RoleAssignmentDto(
                            assignment.getId(),
                            assignment.getUserId(),
                            user == null ? "" : safeValue(user.getEmail()),
                            userName,
                            assignment.getRoleId(),
                            role == null ? "Unknown Role" : role.getName()
                    );
                })
                .sorted(Comparator.comparing(RoleAssignmentDto::getUserEmail).thenComparing(RoleAssignmentDto::getRoleName))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> getRolesForUser(String email) {
        boolean isAdmin = false;
        UserDto user = null;
        try {
            user = userServiceClient.getUserByEmail(email);
            isAdmin = user != null && "Admin".equalsIgnoreCase(user.getAccessLevel());
        } catch (Exception ignored) {
        }

        List<String> assignedRoleNames = new ArrayList<>();
        if (user != null && user.getId() != null) {
            List<UserRoleAssignment> assignments = assignmentRepository.findByUserId(user.getId());
            if (!assignments.isEmpty()) {
                Map<String, Role> roleById = roleRepository.findAllById(assignments.stream().map(UserRoleAssignment::getRoleId).toList())
                        .stream()
                        .collect(Collectors.toMap(Role::getId, role -> role, (first, second) -> first));
                assignedRoleNames = assignments.stream()
                        .map(assignment -> roleById.get(assignment.getRoleId()))
                        .filter(role -> role != null)
                        .map(Role::getName)
                        .collect(Collectors.toCollection(ArrayList::new));
            }
        }

        if (assignedRoleNames.isEmpty()) {
            if (isAdmin) {
                return List.of("ReadOnly", "Support", "InventoryManager");
            }
            return List.of("ReadOnly");
        }

        List<String> resolved = new ArrayList<>(assignedRoleNames);
        if (isAdmin && resolved.stream().noneMatch(role -> role.equalsIgnoreCase("Support"))) {
            addRoleIfExists(resolved, "Support");
        }
        if (isAdmin && resolved.stream().noneMatch(role -> role.equalsIgnoreCase("InventoryManager"))) {
            addRoleIfExists(resolved, "InventoryManager");
        }

        return resolved;
    }

    public boolean userHasRole(String email, String roleName) {
        return getRolesForUser(email).stream().anyMatch(role -> role.equalsIgnoreCase(roleName));
    }

    public void assignDefaultRoleByEmail(String userEmail) {
        UserDto user = userServiceClient.getUserByEmail(userEmail);
        if (user == null || user.getId() == null) {
            throw new RuntimeException("User not found");
        }

        Role defaultRole = roleRepository.findByNameIgnoreCase("ReadOnly")
                .orElseThrow(() -> new RuntimeException("ReadOnly role is not configured"));

        assignRoleInternal(user.getId(), defaultRole.getId());
    }

    private void validateRoleRequest(RoleDto request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new RuntimeException("Role name is required");
        }

        if (request.getDescription() == null || request.getDescription().isBlank()) {
            throw new RuntimeException("Role description is required");
        }
    }

    private String resolveUserId(RoleAssignmentRequest request) {
        if (request.getUserId() != null && !request.getUserId().isBlank()) {
            return request.getUserId();
        }

        if (request.getUserEmail() != null && !request.getUserEmail().isBlank()) {
            UserDto user = userServiceClient.getUserByEmail(request.getUserEmail());
            if (user != null && user.getId() != null) {
                return user.getId();
            }
        }

        throw new RuntimeException("userId or userEmail is required");
    }

    private String resolveRoleId(RoleAssignmentRequest request) {
        if (request.getRoleId() != null && !request.getRoleId().isBlank()) {
            return request.getRoleId();
        }

        if (request.getRoleName() != null && !request.getRoleName().isBlank()) {
            Optional<Role> role = roleRepository.findByNameIgnoreCase(request.getRoleName());
            if (role.isPresent()) {
                return role.get().getId();
            }
        }

        throw new RuntimeException("roleId or roleName is required");
    }

    private void ensureRoleExistsById(String roleId) {
        if (!roleRepository.existsById(roleId)) {
            throw new RuntimeException("Role not found");
        }
    }

    private void ensureUserExistsById(String userId) {
        UserDto user = userServiceClient.getUserById(userId);
        if (user == null || user.getId() == null) {
            throw new RuntimeException("User not found");
        }
    }

    private RoleDto toRoleDto(Role role) {
        return new RoleDto(role.getId(), role.getName(), role.getDescription(), role.isEditable());
    }

    private String safeValue(String value) {
        return value == null ? "" : value;
    }

    private void addRoleIfExists(List<String> roles, String roleName) {
        if (roleRepository.findByNameIgnoreCase(roleName).isPresent()) {
            roles.add(roleName);
        }
    }

    private void validateAdmin(String requesterEmail) {
        UserDto user = userServiceClient.getUserByEmail(requesterEmail);
        if (user == null || user.getAccessLevel() == null || !"Admin".equalsIgnoreCase(user.getAccessLevel())) {
            throw new RuntimeException("Only Admin users can manage roles");
        }
    }
}
