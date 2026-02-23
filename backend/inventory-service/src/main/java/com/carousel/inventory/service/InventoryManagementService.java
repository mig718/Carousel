package com.carousel.inventory.service;

import com.carousel.inventory.client.RoleServiceClient;
import com.carousel.inventory.client.UserServiceClient;
import com.carousel.inventory.domain.InventoryItem;
import com.carousel.inventory.domain.ResourceType;
import com.carousel.inventory.dto.*;
import com.carousel.inventory.repository.InventoryItemRepository;
import com.carousel.inventory.repository.ResourceTypeRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class InventoryManagementService {
    private final ResourceTypeRepository resourceTypeRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final RoleServiceClient roleServiceClient;
    private final UserServiceClient userServiceClient;

    public InventoryManagementService(
            ResourceTypeRepository resourceTypeRepository,
            InventoryItemRepository inventoryItemRepository,
            RoleServiceClient roleServiceClient,
            UserServiceClient userServiceClient
    ) {
        this.resourceTypeRepository = resourceTypeRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.roleServiceClient = roleServiceClient;
        this.userServiceClient = userServiceClient;
    }

    @PostConstruct
    public void ensureDefaultTypes() {
        createDefaultTypeIfMissing("Stone", "Natural and lab stones used in jewelry", "💎");
        createDefaultTypeIfMissing("Metal", "Precious and non-precious metals", "🪙");
        createDefaultTypeIfMissing("Casting", "Pre-made casts of jewelry models", "🧩");
    }

    private void createDefaultTypeIfMissing(String name, String description, String icon) {
        if (resourceTypeRepository.existsByNameIgnoreCase(name)) {
            return;
        }

        ResourceType type = new ResourceType();
        type.setName(name);
        type.setDescription(description);
        type.setIcon(icon);
        type.setCreatedAt(LocalDateTime.now());
        type.setUpdatedAt(LocalDateTime.now());
        resourceTypeRepository.save(type);
    }

    public List<ResourceTypeDto> getAllTypes(String requesterEmail) {
        ensureInventoryAccess(requesterEmail);
        return resourceTypeRepository.findAll().stream()
                .sorted(Comparator.comparing(ResourceType::getName))
                .map(this::toTypeDto)
                .toList();
    }

    public ResourceTypeDto createType(ResourceTypeRequest request, String requesterEmail) {
        ensureTypeManagementAccess(requesterEmail);

        String typeName = requiredText(request.getName(), "Type name is required");
        if (resourceTypeRepository.existsByNameIgnoreCase(typeName)) {
            throw new RuntimeException("Resource type already exists");
        }

        ResourceType resourceType = new ResourceType();
        resourceType.setName(typeName);
        resourceType.setDescription(requiredText(request.getDescription(), "Type description is required"));
        resourceType.setIcon(normalizeIcon(request.getIcon()));
        resourceType.setCreatedAt(LocalDateTime.now());
        resourceType.setUpdatedAt(LocalDateTime.now());

        if (request.getParentTypeId() != null && !request.getParentTypeId().isBlank()) {
            ResourceType parent = resourceTypeRepository.findById(request.getParentTypeId())
                    .orElseThrow(() -> new RuntimeException("Parent type not found"));
            resourceType.setParentTypeId(parent.getId());
            resourceType.setParentTypeName(parent.getName());
        }

        ResourceType saved = resourceTypeRepository.save(resourceType);
        return toTypeDto(saved);
    }

    public ResourceTypeDto updateType(String typeId, ResourceTypeRequest request, String requesterEmail) {
        ensureTypeManagementAccess(requesterEmail);

        ResourceType existing = resourceTypeRepository.findById(typeId)
                .orElseThrow(() -> new RuntimeException("Resource type not found"));

        existing.setName(requiredText(request.getName(), "Type name is required"));
        existing.setDescription(requiredText(request.getDescription(), "Type description is required"));
        existing.setIcon(normalizeIcon(request.getIcon()));

        if (request.getParentTypeId() != null && !request.getParentTypeId().isBlank()) {
            ResourceType parent = resourceTypeRepository.findById(request.getParentTypeId())
                    .orElseThrow(() -> new RuntimeException("Parent type not found"));
            if (parent.getId().equals(existing.getId())) {
                throw new RuntimeException("Type cannot be parent of itself");
            }
            existing.setParentTypeId(parent.getId());
            existing.setParentTypeName(parent.getName());
        } else {
            existing.setParentTypeId(null);
            existing.setParentTypeName(null);
        }

        existing.setUpdatedAt(LocalDateTime.now());
        ResourceType saved = resourceTypeRepository.save(existing);
        return toTypeDto(saved);
    }

    public List<String> getIconCollection() {
        return List.of("💎", "🪙", "🧩", "📿", "🔗", "💠", "⚙️", "✨", "🔶", "🧿", "🪄", "🧱");
    }

    public List<InventoryItemDto> getItems(String requesterEmail) {
        ensureInventoryAccess(requesterEmail);
        return inventoryItemRepository.findAll().stream()
                .sorted(Comparator.comparing(InventoryItem::getName))
                .map(this::toItemDto)
                .toList();
    }

    public InventoryItemDto createItem(InventoryItemRequest request, String requesterEmail) {
        ensureInventoryAccess(requesterEmail);

        ResourceType type = resolveType(request.getResourceTypeId(), "Resource type is required");
        ResourceType subType = resolveOptionalSubType(request.getResourceSubTypeId());

        InventoryItem item = new InventoryItem();
        item.setName(requiredText(request.getName(), "Item name is required"));
        item.setDescription(requiredText(request.getDescription(), "Item description is required"));
        item.setResourceTypeId(type.getId());
        item.setResourceTypeName(type.getName());
        item.setAvailableQuantity(normalizeQuantity(request.getAvailableQuantity()));
        item.setCreatedAt(LocalDateTime.now());
        item.setUpdatedAt(LocalDateTime.now());

        if (subType != null) {
            validateSubtypeBelongsToType(subType, type);
            item.setResourceSubTypeId(subType.getId());
            item.setResourceSubTypeName(subType.getName());
        }

        InventoryItem saved = inventoryItemRepository.save(item);
        return toItemDto(saved);
    }

    public InventoryItemDto updateItem(String itemId, InventoryItemRequest request, String requesterEmail) {
        ensureInventoryAccess(requesterEmail);

        InventoryItem existing = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        if (request.getName() != null && !request.getName().isBlank()) {
            existing.setName(request.getName().trim());
        }
        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            existing.setDescription(request.getDescription().trim());
        }

        if (request.getResourceTypeId() != null && !request.getResourceTypeId().isBlank()) {
            ResourceType type = resolveType(request.getResourceTypeId(), "Resource type is required");
            existing.setResourceTypeId(type.getId());
            existing.setResourceTypeName(type.getName());
            if (existing.getResourceSubTypeId() != null) {
                ResourceType existingSubtype = resourceTypeRepository.findById(existing.getResourceSubTypeId())
                        .orElse(null);
                if (existingSubtype != null && !type.getId().equals(existingSubtype.getParentTypeId())) {
                    existing.setResourceSubTypeId(null);
                    existing.setResourceSubTypeName(null);
                }
            }
        }

        if (request.getResourceSubTypeId() != null) {
            if (request.getResourceSubTypeId().isBlank()) {
                existing.setResourceSubTypeId(null);
                existing.setResourceSubTypeName(null);
            } else {
                ResourceType subType = resolveOptionalSubType(request.getResourceSubTypeId());
                if (subType == null) {
                    throw new RuntimeException("Resource subtype not found");
                }

                ResourceType type = resolveType(existing.getResourceTypeId(), "Resource type is required");
                validateSubtypeBelongsToType(subType, type);

                existing.setResourceSubTypeId(subType.getId());
                existing.setResourceSubTypeName(subType.getName());
            }
        }

        if (request.getAvailableQuantity() != null) {
            existing.setAvailableQuantity(normalizeQuantity(request.getAvailableQuantity()));
        }

        existing.setUpdatedAt(LocalDateTime.now());
        InventoryItem saved = inventoryItemRepository.save(existing);
        return toItemDto(saved);
    }

    public InventoryItemDto adjustQuantity(String itemId, int quantityDelta, String requesterEmail) {
        ensureInventoryAccess(requesterEmail);

        InventoryItem existing = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        int newQuantity = existing.getAvailableQuantity() + quantityDelta;
        if (newQuantity < 0) {
            throw new RuntimeException("Available quantity cannot be negative");
        }

        existing.setAvailableQuantity(newQuantity);
        existing.setUpdatedAt(LocalDateTime.now());
        InventoryItem saved = inventoryItemRepository.save(existing);
        return toItemDto(saved);
    }

    private void ensureInventoryAccess(String requesterEmail) {
        AuthorizationContext context = resolveAuthorizationContext(requesterEmail);

        if (context.isAdmin) {
            return;
        }

        if (context.hasAnyRole("inventorymanager", "inventoryuser", "inventoryadmin")) {
            return;
        }

        throw new RuntimeException("Insufficient role privileges to manage inventory");
    }

    private void ensureTypeManagementAccess(String requesterEmail) {
        AuthorizationContext context = resolveAuthorizationContext(requesterEmail);

        if (context.isAdmin) {
            return;
        }

        if (context.hasAnyRole("inventorymanager", "inventoryadmin")) {
            return;
        }

        throw new RuntimeException("Insufficient role privileges to manage resource types");
    }

    private AuthorizationContext resolveAuthorizationContext(String requesterEmail) {
        String normalizedEmail = requiredText(requesterEmail, "Requester email is required");

        boolean isAdmin = false;
        try {
            UserDto user = userServiceClient.getUserByEmail(normalizedEmail);
            isAdmin = user != null && user.getAccessLevel() != null && "Admin".equalsIgnoreCase(user.getAccessLevel());
        } catch (Exception ignored) {
        }

        List<String> roles;
        try {
            roles = roleServiceClient.getRolesForUser(normalizedEmail);
        } catch (Exception e) {
            roles = List.of();
        }

        return new AuthorizationContext(isAdmin, roles);
    }

    private String requiredText(String text, String message) {
        if (text == null || text.isBlank()) {
            throw new RuntimeException(message);
        }
        return text.trim();
    }

    private int normalizeQuantity(Integer quantity) {
        if (quantity == null) {
            return 0;
        }
        if (quantity < 0) {
            throw new RuntimeException("Available quantity cannot be negative");
        }
        return quantity;
    }

    private String normalizeIcon(String icon) {
        if (icon == null || icon.isBlank()) {
            return "📦";
        }
        return icon.trim();
    }

    private ResourceType resolveType(String typeId, String requiredMessage) {
        String normalizedId = requiredText(typeId, requiredMessage);
        return resourceTypeRepository.findById(normalizedId)
                .orElseThrow(() -> new RuntimeException("Resource type not found"));
    }

    private ResourceType resolveOptionalSubType(String subtypeId) {
        if (subtypeId == null || subtypeId.isBlank()) {
            return null;
        }

        return resourceTypeRepository.findById(subtypeId)
                .orElseThrow(() -> new RuntimeException("Resource subtype not found"));
    }

    private void validateSubtypeBelongsToType(ResourceType subType, ResourceType type) {
        if (subType.getParentTypeId() == null || subType.getParentTypeId().isBlank()) {
            throw new RuntimeException("Provided subtype is not a subtype");
        }
        if (!subType.getParentTypeId().equals(type.getId())) {
            throw new RuntimeException("Subtype does not belong to selected type");
        }
    }

    private ResourceTypeDto toTypeDto(ResourceType type) {
        return new ResourceTypeDto(
                type.getId(),
                type.getName(),
                type.getDescription(),
                type.getIcon(),
                type.getParentTypeId(),
                type.getParentTypeName()
        );
    }

    private InventoryItemDto toItemDto(InventoryItem item) {
        return new InventoryItemDto(
                item.getId(),
                item.getName(),
                item.getDescription(),
                item.getResourceTypeId(),
                item.getResourceTypeName(),
                item.getResourceSubTypeId(),
                item.getResourceSubTypeName(),
                item.getAvailableQuantity()
        );
    }

    private static class AuthorizationContext {
        private final boolean isAdmin;
        private final List<String> roles;

        private AuthorizationContext(boolean isAdmin, List<String> roles) {
            this.isAdmin = isAdmin;
            this.roles = roles == null ? List.of() : roles;
        }

        private boolean hasAnyRole(String... targets) {
            for (String role : roles) {
                String normalizedRole = role == null ? "" : role.toLowerCase(Locale.ROOT);
                for (String target : targets) {
                    if (normalizedRole.equals(target)) {
                        return true;
                    }
                }
            }
            return false;
        }
    }
}
