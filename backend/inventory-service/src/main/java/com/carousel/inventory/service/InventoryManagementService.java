package com.carousel.inventory.service;

import com.carousel.inventory.client.RoleServiceClient;
import com.carousel.inventory.client.UserServiceClient;
import com.carousel.inventory.domain.InventoryItem;
import com.carousel.inventory.domain.InventoryItemCustomTag;
import com.carousel.inventory.domain.Resource;
import com.carousel.inventory.domain.ResourceTag;
import com.carousel.inventory.domain.ResourceType;
import com.carousel.inventory.domain.TagGraphic;
import com.carousel.inventory.dto.*;
import com.carousel.inventory.repository.InventoryItemRepository;
import com.carousel.inventory.repository.InventoryItemCustomTagRepository;
import com.carousel.inventory.repository.ResourceRepository;
import com.carousel.inventory.repository.ResourceTagRepository;
import com.carousel.inventory.repository.ResourceTypeRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.text.Normalizer;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class InventoryManagementService {
    private final ResourceRepository resourceRepository;
    private final ResourceTypeRepository resourceTypeRepository;
    private final ResourceTagRepository resourceTagRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryItemCustomTagRepository inventoryItemCustomTagRepository;
    private final RoleServiceClient roleServiceClient;
    private final UserServiceClient userServiceClient;

    private static final List<String> ICON_LIBRARY = List.of("💎", "🪙", "🧩", "🔗", "⚙", "📏", "🧵", "📦");
    private static final String DEFAULT_TAG_COLOR = "#4F46E5";
    private static final TagGraphic DEFAULT_TAG_GRAPHIC = TagGraphic.Diamond;
    private static final Pattern HEX_COLOR_PATTERN = Pattern.compile("^#[0-9a-fA-F]{6}$");

    private static final List<SeedType> DEFAULT_RESOURCE_TYPES = List.of(
            new SeedType("Metal", "Base metal resources used in jewelry production", "🪙"),
            new SeedType("Stone", "Natural or lab stones including melee and center stones", "💎"),
            new SeedType("Cast", "Pre-cast models and wax/cast artifacts", "🧩"),
            new SeedType("Finding", "Clasps, hooks, jump rings and other findings", "🔗"),
            new SeedType("Consumable", "Solders, fluxes and process consumables", "⚙️")
    );

        private static final List<SeedTag> DEFAULT_RESOURCE_TAGS = List.of(
            new SeedTag("yellow", "Color tone", "#EAB308", TagGraphic.Star),
            new SeedTag("white", "Color tone", "#CBD5E1", TagGraphic.Spark),
            new SeedTag("rose", "Color tone", "#F472B6", TagGraphic.Droplet),
            new SeedTag("gold", "Metal family", "#F59E0B", TagGraphic.Bullion),
            new SeedTag("silver", "Metal family", "#94A3B8", TagGraphic.Ingot),
            new SeedTag("platinum", "Metal family", "#64748B", TagGraphic.Shield),
            new SeedTag("palladium", "Metal family", "#475569", TagGraphic.Anvil),
            new SeedTag("18k", "Karat purity", "#F97316", TagGraphic.Gem),
            new SeedTag("14k", "Karat purity", "#EA580C", TagGraphic.Gem),
            new SeedTag("10k", "Karat purity", "#FB7185", TagGraphic.Gem),
            new SeedTag("wire", "Form factor", "#2563EB", TagGraphic.Thread),
            new SeedTag("spool", "Form factor", "#0EA5E9", TagGraphic.Thread),
            new SeedTag("cube", "Form factor", "#6366F1", TagGraphic.Box),
            new SeedTag("sheet", "Form factor", "#4338CA", TagGraphic.Ruler),
            new SeedTag("granules", "Form factor", "#A855F7", TagGraphic.Crucible),
            new SeedTag("micro-pave", "Setting style", "#22C55E", TagGraphic.Diamond),
            new SeedTag("round", "Stone shape", "#14B8A6", TagGraphic.Diamond),
            new SeedTag("princess", "Stone shape", "#06B6D4", TagGraphic.Diamond),
            new SeedTag("baguette", "Stone shape", "#0EA5E9", TagGraphic.Diamond),
            new SeedTag("casting", "Manufacturing process", "#F43F5E", TagGraphic.Cast),
            new SeedTag("model-x", "Model series", "#8B5CF6", TagGraphic.Gear),
            new SeedTag("model-y", "Model series", "#7C3AED", TagGraphic.Gear)
    );

    public InventoryManagementService(
            ResourceRepository resourceRepository,
            ResourceTypeRepository resourceTypeRepository,
            ResourceTagRepository resourceTagRepository,
            InventoryItemRepository inventoryItemRepository,
            InventoryItemCustomTagRepository inventoryItemCustomTagRepository,
            RoleServiceClient roleServiceClient,
                UserServiceClient userServiceClient
    ) {
        this.resourceRepository = resourceRepository;
        this.resourceTypeRepository = resourceTypeRepository;
        this.resourceTagRepository = resourceTagRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.inventoryItemCustomTagRepository = inventoryItemCustomTagRepository;
        this.roleServiceClient = roleServiceClient;
        this.userServiceClient = userServiceClient;
    }

    @PostConstruct
    void seedDefaults() {
        seedResourceTypes();
        seedResourceTags();
    }

    public List<ResourceTypeDto> getResourceTypes(String requesterEmail) {
        ensureInventoryAccess(requesterEmail);

        return resourceTypeRepository.findAll().stream()
                .sorted(Comparator.comparing(ResourceType::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toResourceTypeDto)
                .toList();
    }

    public ResourceTypeDto createResourceType(ResourceTypeRequest request, String requesterEmail) {
        ensureResourceManagementAccess(requesterEmail);

        String name = requiredText(request.getName(), "Resource type name is required");
        String description = requiredText(request.getDescription(), "Resource type description is required");
        String icon = normalizeIcon(request.getIcon());

        if (resourceTypeRepository.existsByNameIgnoreCase(name)) {
            throw new RuntimeException("Resource type already exists");
        }

        ResourceType type = new ResourceType();
        type.setName(name);
        type.setDescription(description);
        type.setIcon(icon);
        type.setEditable(true);
        type.setParentTypeId(request.getParentTypeId());
        type.setParentTypeName(null);
        type.setCreatedAt(LocalDateTime.now());
        type.setUpdatedAt(LocalDateTime.now());

        return toResourceTypeDto(resourceTypeRepository.save(type));
    }

    public ResourceTypeDto updateResourceType(String resourceTypeId, ResourceTypeRequest request, String requesterEmail) {
        ensureResourceManagementAccess(requesterEmail);

        ResourceType existing = resourceTypeRepository.findById(resourceTypeId)
                .orElseThrow(() -> new RuntimeException("Resource type not found"));

        if (!existing.isEditable()) {
            throw new RuntimeException("Predefined resource types cannot be edited");
        }

        String name = requiredText(request.getName(), "Resource type name is required");
        String description = requiredText(request.getDescription(), "Resource type description is required");
        String icon = normalizeIcon(request.getIcon());

        Optional<ResourceType> conflict = resourceTypeRepository.findByNameIgnoreCase(name);
        if (conflict.isPresent() && !conflict.get().getId().equals(existing.getId())) {
            throw new RuntimeException("Resource type already exists");
        }

        existing.setName(name);
        existing.setDescription(description);
        existing.setIcon(icon);
        existing.setUpdatedAt(LocalDateTime.now());

        ResourceType saved = resourceTypeRepository.save(existing);

        resourceRepository.findAll().stream()
                .filter(resource -> saved.getId().equals(resource.getResourceTypeId()))
                .forEach(resource -> {
                    List<String> tags = parseCsv(resource.getResourceTags());
                    applyResourceTypeSnapshot(resource, saved, tags);
                    resource.setUpdatedAt(LocalDateTime.now());
                    resourceRepository.save(resource);

                    inventoryItemRepository.findAll().stream()
                            .filter(item -> resource.getId().equals(item.getResourceId()))
                            .forEach(item -> {
                                item.setResourceCategory(resource.getCategory());
                                item.setResourceType(resource.getType());
                                item.setResourceSubType(resource.getSubType());
                                item.setResourceTags(resource.getResourceTags());
                                item.setResourceIcon(resource.getIcon());
                                item.setUpdatedAt(LocalDateTime.now());
                                inventoryItemRepository.save(item);
                            });
                });

        return toResourceTypeDto(saved);
    }

    public void deleteResourceType(String resourceTypeId, String requesterEmail) {
        ensureResourceManagementAccess(requesterEmail);

        ResourceType existing = resourceTypeRepository.findById(resourceTypeId)
                .orElseThrow(() -> new RuntimeException("Resource type not found"));

        if (!existing.isEditable()) {
            throw new RuntimeException("Predefined resource types cannot be deleted");
        }

        boolean inUse = resourceRepository.findAll().stream()
                .anyMatch(resource -> resourceTypeId.equals(resource.getResourceTypeId()));
        if (inUse) {
            throw new RuntimeException("Resource type is in use by existing resources");
        }

        resourceTypeRepository.delete(existing);
    }

    public List<ResourceTagDto> getResourceTags(String requesterEmail) {
        ensureInventoryAccess(requesterEmail);

        return resourceTagRepository.findAll().stream()
                .sorted(Comparator.comparing(ResourceTag::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toResourceTagDto)
                .toList();
    }

    public ResourceTagDto createResourceTag(ResourceTagRequest request, String requesterEmail) {
        ensureResourceManagementAccess(requesterEmail);

        String name = requiredText(request.getName(), "Resource tag name is required").toLowerCase(Locale.ROOT);
        String description = requiredText(request.getDescription(), "Resource tag description is required");
        String color = normalizeTagColor(request.getColor());
        String graphic = normalizeTagGraphic(request.getGraphic());

        if (resourceTagRepository.existsByNameIgnoreCase(name)) {
            throw new RuntimeException("Resource tag already exists");
        }

        ResourceTag tag = new ResourceTag();
        tag.setName(name);
        tag.setDescription(description);
        tag.setColor(color);
        tag.setGraphic(graphic);
        tag.setEditable(true);
        tag.setCreatedAt(LocalDateTime.now());
        tag.setUpdatedAt(LocalDateTime.now());

        return toResourceTagDto(resourceTagRepository.save(tag));
    }

    public ResourceTagDto updateResourceTag(String resourceTagId, ResourceTagRequest request, String requesterEmail) {
        ensureResourceManagementAccess(requesterEmail);

        ResourceTag existing = resourceTagRepository.findById(resourceTagId)
                .orElseThrow(() -> new RuntimeException("Resource tag not found"));

        if (!existing.isEditable()) {
            throw new RuntimeException("Predefined resource tags cannot be edited");
        }

        String name = requiredText(request.getName(), "Resource tag name is required").toLowerCase(Locale.ROOT);
        String description = requiredText(request.getDescription(), "Resource tag description is required");
        String color = normalizeTagColor(request.getColor());
        String graphic = normalizeTagGraphic(request.getGraphic());

        Optional<ResourceTag> conflict = resourceTagRepository.findByNameIgnoreCase(name);
        if (conflict.isPresent() && !conflict.get().getId().equals(existing.getId())) {
            throw new RuntimeException("Resource tag already exists");
        }

        existing.setName(name);
        existing.setDescription(description);
        existing.setColor(color);
        existing.setGraphic(graphic);
        existing.setUpdatedAt(LocalDateTime.now());

        ResourceTag saved = resourceTagRepository.save(existing);

        resourceRepository.findAll().stream()
                .filter(resource -> parseCsv(resource.getResourceTags()).stream().anyMatch(tag -> tag.equalsIgnoreCase(existing.getName())))
                .forEach(resource -> {
                    List<String> normalizedTags = parseCsv(resource.getResourceTags()).stream()
                            .map(tag -> tag.equalsIgnoreCase(existing.getName()) ? saved.getName() : tag)
                            .toList();
                    resource.setResourceTags(joinTags(normalizedTags));
                    resource.setType(buildFullTypeName(resource.getCategory(), normalizedTags));
                    resource.setSubType(joinTags(normalizedTags));
                    resource.setUpdatedAt(LocalDateTime.now());
                    resourceRepository.save(resource);

                    inventoryItemRepository.findAll().stream()
                            .filter(item -> resource.getId().equals(item.getResourceId()))
                            .forEach(item -> {
                                item.setResourceType(resource.getType());
                                item.setResourceSubType(resource.getSubType());
                                item.setResourceTags(resource.getResourceTags());
                                item.setUpdatedAt(LocalDateTime.now());
                                inventoryItemRepository.save(item);
                            });
                });

        return toResourceTagDto(saved);
    }

    public void deleteResourceTag(String resourceTagId, String requesterEmail) {
        ensureResourceManagementAccess(requesterEmail);

        ResourceTag existing = resourceTagRepository.findById(resourceTagId)
                .orElseThrow(() -> new RuntimeException("Resource tag not found"));

        if (!existing.isEditable()) {
            throw new RuntimeException("Predefined resource tags cannot be deleted");
        }

        boolean inUse = resourceRepository.findAll().stream()
                .anyMatch(resource -> parseCsv(resource.getResourceTags()).stream().anyMatch(tag -> tag.equalsIgnoreCase(existing.getName())));
        if (inUse) {
            throw new RuntimeException("Resource tag is in use by existing resources");
        }

        resourceTagRepository.delete(existing);
    }

    public List<String> getIconLibrary(String requesterEmail) {
        ensureInventoryAccess(requesterEmail);
        return ICON_LIBRARY;
    }

    public List<TagGraphicOptionDto> getTagGraphicOptions(String requesterEmail) {
        ensureInventoryAccess(requesterEmail);

        return Arrays.stream(TagGraphic.values())
                .map(graphic -> new TagGraphicOptionDto(graphic.name(), graphic.getDisplayName(), graphic.getIcon()))
                .toList();
    }

    public List<ResourceDto> getAllResources(String requesterEmail) {
        ensureInventoryAccess(requesterEmail);

        return resourceRepository.findAll().stream()
                .sorted(Comparator
                        .comparing(Resource::getCategory, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(Resource::getType, String.CASE_INSENSITIVE_ORDER)
                )
                .map(this::toResourceDto)
                .toList();
    }

    public ResourceDto createResource(ResourceRequest request, String requesterEmail) {
        ensureResourceManagementAccess(requesterEmail);

        ResourceType resourceType = resolveResourceType(request);
        List<ResourceTag> resolvedTags = resolveTags(request.getTagIds());
        String description = requiredText(request.getDescription(), "Resource description is required");

        List<String> normalizedTagNames = resolvedTags.stream()
                .map(ResourceTag::getName)
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();

        Resource resource = new Resource();
        resource.setResourceTypeId(resourceType.getId());
        resource.setDescription(description);
        applyResourceTypeSnapshot(resource, resourceType, normalizedTagNames);
        resource.setCreatedAt(LocalDateTime.now());
        resource.setUpdatedAt(LocalDateTime.now());

        return toResourceDto(resourceRepository.save(resource));
    }

    public ResourceDto updateResource(String resourceId, ResourceRequest request, String requesterEmail) {
        ensureResourceManagementAccess(requesterEmail);

        Resource existing = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        ResourceType resourceType = resolveResourceTypeForUpdate(request, existing.getResourceTypeId());
        List<ResourceTag> resolvedTags = resolveTags(request.getTagIds());
        String description = requiredText(request.getDescription(), "Resource description is required");

        List<String> normalizedTagNames = resolvedTags.stream()
                .map(ResourceTag::getName)
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();

        existing.setResourceTypeId(resourceType.getId());
        existing.setDescription(description);
        applyResourceTypeSnapshot(existing, resourceType, normalizedTagNames);
        existing.setUpdatedAt(LocalDateTime.now());

        Resource saved = resourceRepository.save(existing);

        inventoryItemRepository.findAll().stream()
                .filter(item -> saved.getId().equals(item.getResourceId()))
                .forEach(item -> {
                    item.setResourceCategory(saved.getCategory());
                    item.setResourceType(saved.getType());
                    item.setResourceSubType(saved.getSubType());
                    item.setResourceTags(saved.getResourceTags());
                    item.setResourceIcon(saved.getIcon());
                    item.setResourceDescription(saved.getDescription());
                    item.setUpdatedAt(LocalDateTime.now());
                    inventoryItemRepository.save(item);
                });

        return toResourceDto(saved);
    }

    public List<ResourceCatalogDto> getResourceCatalog(String requesterEmail) {
        ensureInventoryAccess(requesterEmail);

        List<ResourceCatalogDto.ResourceCatalogTypeDto> typeDtos = resourceTypeRepository.findAll().stream()
                .sorted(Comparator.comparing(ResourceType::getName, String.CASE_INSENSITIVE_ORDER))
                .map(type -> new ResourceCatalogDto.ResourceCatalogTypeDto(type.getName(), List.of()))
                .toList();

        return List.of(new ResourceCatalogDto("Resource Types", typeDtos));
    }

    public List<InventoryItemDto> getItems(String requesterEmail) {
        ensureInventoryAccess(requesterEmail);

        return inventoryItemRepository.findAll().stream()
                .sorted(Comparator
                        .comparing(InventoryItem::getResourceCategory, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(InventoryItem::getResourceType, String.CASE_INSENSITIVE_ORDER)
                )
                .map(this::toItemDto)
                .toList();
    }

    public InventoryItemDto getItemById(String itemId, String requesterEmail) {
        ensureInventoryAccess(requesterEmail);

        InventoryItem item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        return toItemDto(item);
    }

    public List<InventoryItemCustomTagDto> getItemCustomTags(String requesterEmail) {
        ensureInventoryAccess(requesterEmail);

        return inventoryItemCustomTagRepository.findAll().stream()
                .sorted(Comparator.comparing(InventoryItemCustomTag::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toInventoryItemCustomTagDto)
                .toList();
    }

    public InventoryItemCustomTagDto createItemCustomTag(InventoryItemCustomTagRequest request, String requesterEmail) {
        ensureInventoryAccess(requesterEmail);

        String name = requiredText(request.getName(), "Item custom tag name is required");
        String description = requiredText(request.getDescription(), "Item custom tag description is required");
        String color = normalizeTagColor(request.getColor());
        String graphic = normalizeTagGraphic(request.getGraphic());

        if (inventoryItemCustomTagRepository.existsByNameIgnoreCase(name)) {
            throw new RuntimeException("Item custom tag already exists");
        }

        InventoryItemCustomTag tag = new InventoryItemCustomTag();
        tag.setName(name);
        tag.setDescription(description);
        tag.setColor(color);
        tag.setGraphic(graphic);
        tag.setEditable(true);
        tag.setCreatedAt(LocalDateTime.now());
        tag.setUpdatedAt(LocalDateTime.now());

        return toInventoryItemCustomTagDto(inventoryItemCustomTagRepository.save(tag));
    }

    public InventoryItemCustomTagDto updateItemCustomTag(String tagId, InventoryItemCustomTagRequest request, String requesterEmail) {
        ensureInventoryAccess(requesterEmail);

        InventoryItemCustomTag existing = inventoryItemCustomTagRepository.findById(tagId)
                .orElseThrow(() -> new RuntimeException("Item custom tag not found"));

        String name = requiredText(request.getName(), "Item custom tag name is required");
        String description = requiredText(request.getDescription(), "Item custom tag description is required");
        String color = normalizeTagColor(request.getColor());
        String graphic = normalizeTagGraphic(request.getGraphic());

        Optional<InventoryItemCustomTag> conflict = inventoryItemCustomTagRepository.findByNameIgnoreCase(name);
        if (conflict.isPresent() && !conflict.get().getId().equals(existing.getId())) {
            throw new RuntimeException("Item custom tag already exists");
        }

        existing.setName(name);
        existing.setDescription(description);
        existing.setColor(color);
        existing.setGraphic(graphic);
        existing.setUpdatedAt(LocalDateTime.now());

        return toInventoryItemCustomTagDto(inventoryItemCustomTagRepository.save(existing));
    }

    public void deleteItemCustomTag(String tagId, String requesterEmail) {
        ensureInventoryAccess(requesterEmail);

        InventoryItemCustomTag existing = inventoryItemCustomTagRepository.findById(tagId)
                .orElseThrow(() -> new RuntimeException("Item custom tag not found"));

        boolean inUse = inventoryItemRepository.findAll().stream()
                .anyMatch(item -> parseIdCsv(item.getCustomTagIds()).stream().anyMatch(id -> id.equals(existing.getId())));

        if (inUse) {
            throw new RuntimeException("Item custom tag is in use by existing inventory items");
        }

        inventoryItemCustomTagRepository.delete(existing);
    }

    public InventoryItemDto createItem(InventoryItemRequest request, String requesterEmail) {
        ensureInventoryAccess(requesterEmail);

        Resource resource = resolveResource(request.getResourceId(), "Resource is required");
        List<InventoryItemCustomTag> customTags = resolveInventoryItemCustomTags(request.getCustomTagIds());

        InventoryItem item = new InventoryItem();
        item.setResourceId(resource.getId());
        item.setResourceCategory(resource.getCategory());
        item.setResourceType(resource.getType());
        item.setResourceSubType(resource.getSubType());
        item.setResourceTags(resource.getResourceTags());
        item.setResourceIcon(resource.getIcon());
        item.setResourceDescription(resource.getDescription());
        item.setCustomTagIds(joinIds(customTags.stream().map(InventoryItemCustomTag::getId).toList()));
        item.setAvailableQuantity(normalizeQuantity(request.getAvailableQuantity()));
        item.setPendingQuantity(normalizeQuantity(request.getPendingQuantity()));
        item.setCreatedAt(LocalDateTime.now());
        item.setUpdatedAt(LocalDateTime.now());

        return toItemDto(inventoryItemRepository.save(item));
    }

    public InventoryItemDto updateItem(String itemId, InventoryItemRequest request, String requesterEmail) {
        ensureInventoryAccess(requesterEmail);

        InventoryItem existing = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        if (request.getResourceId() != null && !request.getResourceId().isBlank()) {
            Resource resource = resolveResource(request.getResourceId(), "Resource is required");
            existing.setResourceId(resource.getId());
            existing.setResourceCategory(resource.getCategory());
            existing.setResourceType(resource.getType());
            existing.setResourceSubType(resource.getSubType());
            existing.setResourceTags(resource.getResourceTags());
            existing.setResourceIcon(resource.getIcon());
            existing.setResourceDescription(resource.getDescription());
        }

        if (request.getAvailableQuantity() != null) {
            existing.setAvailableQuantity(normalizeQuantity(request.getAvailableQuantity()));
        }
        if (request.getPendingQuantity() != null) {
            existing.setPendingQuantity(normalizeQuantity(request.getPendingQuantity()));
        }
        if (request.getCustomTagIds() != null) {
            List<InventoryItemCustomTag> customTags = resolveInventoryItemCustomTags(request.getCustomTagIds());
            existing.setCustomTagIds(joinIds(customTags.stream().map(InventoryItemCustomTag::getId).toList()));
        }

        existing.setUpdatedAt(LocalDateTime.now());
        return toItemDto(inventoryItemRepository.save(existing));
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
        return toItemDto(inventoryItemRepository.save(existing));
    }

    private void ensureInventoryAccess(String requesterEmail) {
        AuthorizationContext context = resolveAuthorizationContext(requesterEmail);

        if (context.isAdmin) {
            return;
        }

        if (context.hasAnyRole("poweruser")) {
            return;
        }

        if (context.hasAnyRole("inventorymanager", "inventoryuser")) {
            return;
        }

        throw new RuntimeException("Insufficient role privileges to manage inventory");
    }

    private void ensureResourceManagementAccess(String requesterEmail) {
        AuthorizationContext context = resolveAuthorizationContext(requesterEmail);

        if (context.isAdmin) {
            return;
        }

        if (context.hasAnyRole("poweruser")) {
            return;
        }

        if (context.hasAnyRole("inventorymanager")) {
            return;
        }

        throw new RuntimeException("Insufficient role privileges to manage resources");
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

    private ResourceType resolveResourceType(ResourceRequest request) {
        if (request.getResourceTypeId() != null && !request.getResourceTypeId().isBlank()) {
            return resourceTypeRepository.findById(request.getResourceTypeId())
                    .orElseThrow(() -> new RuntimeException("Resource type not found"));
        }

        String legacyCategory = normalizeOptionalText(request.getCategory());
        if (legacyCategory != null) {
            return resourceTypeRepository.findByNameIgnoreCase(legacyCategory)
                    .orElseThrow(() -> new RuntimeException("Resource type not found"));
        }

        throw new RuntimeException("Resource type is required");
    }

    private ResourceType resolveResourceTypeForUpdate(ResourceRequest request, String fallbackTypeId) {
        if (request.getResourceTypeId() != null && !request.getResourceTypeId().isBlank()) {
            return resourceTypeRepository.findById(request.getResourceTypeId())
                    .orElseThrow(() -> new RuntimeException("Resource type not found"));
        }

        if (fallbackTypeId != null && !fallbackTypeId.isBlank()) {
            return resourceTypeRepository.findById(fallbackTypeId)
                    .orElseThrow(() -> new RuntimeException("Resource type not found"));
        }

        String legacyCategory = normalizeOptionalText(request.getCategory());
        if (legacyCategory != null) {
            return resourceTypeRepository.findByNameIgnoreCase(legacyCategory)
                    .orElseThrow(() -> new RuntimeException("Resource type not found"));
        }

        throw new RuntimeException("Resource type is required");
    }

    private List<ResourceTag> resolveTags(List<String> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return List.of();
        }

        List<ResourceTag> resolved = new ArrayList<>();
        for (String tagId : tagIds) {
            if (tagId == null || tagId.isBlank()) {
                continue;
            }
            ResourceTag tag = resourceTagRepository.findById(tagId)
                    .orElseThrow(() -> new RuntimeException("Resource tag not found"));
            resolved.add(tag);
        }

        return resolved;
    }

    private List<InventoryItemCustomTag> resolveInventoryItemCustomTags(List<String> customTagIds) {
        if (customTagIds == null || customTagIds.isEmpty()) {
            return List.of();
        }

        List<InventoryItemCustomTag> resolved = new ArrayList<>();
        for (String tagId : customTagIds) {
            if (tagId == null || tagId.isBlank()) {
                continue;
            }
            InventoryItemCustomTag tag = inventoryItemCustomTagRepository.findById(tagId)
                    .orElseThrow(() -> new RuntimeException("Item custom tag not found"));
            resolved.add(tag);
        }

        return resolved;
    }

    private Resource resolveResource(String resourceId, String requiredMessage) {
        String normalizedId = requiredText(resourceId, requiredMessage);
        return resourceRepository.findById(normalizedId)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
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

    private String normalizeTagColor(String color) {
        String normalized = normalizeOptionalText(color);
        if (normalized == null) {
            return DEFAULT_TAG_COLOR;
        }

        if (!HEX_COLOR_PATTERN.matcher(normalized).matches()) {
            throw new RuntimeException("Tag color must be a hex color like #4F46E5");
        }

        return normalized.toUpperCase(Locale.ROOT);
    }

    private String normalizeTagGraphic(String graphic) {
        return TagGraphic.fromTextOrDefault(graphic, DEFAULT_TAG_GRAPHIC).name();
    }

    private String normalizeOptionalText(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        return text.trim();
    }

    private String normalizeIcon(String icon) {
        String normalized = normalizeOptionalText(icon);
        if (normalized == null) {
            return ICON_LIBRARY.get(0);
        }

        String recovered = recoverUtf8Mojibake(normalized);
        String normalizedToken = normalizeIconToken(recovered);
        String matched = ICON_LIBRARY.stream()
                .filter(candidate -> normalizeIconToken(candidate).equals(normalizedToken))
                .findFirst()
                .orElse(null);

        if (matched != null) {
            return matched;
        }

        if (normalizedToken.equals(normalizeIconToken("⚙")) || normalizedToken.equals(normalizeIconToken("⚙️"))) {
            return "⚙";
        }

        return ICON_LIBRARY.get(0);
    }

    private String normalizeIconToken(String value) {
        if (value == null) {
            return "";
        }

        return Normalizer.normalize(value, Normalizer.Form.NFKC)
                .replace("\uFE0F", "")
                .trim();
    }

    private String recoverUtf8Mojibake(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }

        if (!looksLikeMojibake(value)) {
            return value;
        }

        String recovered = new String(value.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
        if (recovered.isBlank() || recovered.contains("�") || recovered.contains("?")) {
            return value;
        }

        return recovered;
    }

    private boolean looksLikeMojibake(String value) {
        return value.contains("Ã")
                || value.contains("Â")
                || value.contains("â")
                || value.contains("ð")
                || value.contains("ï");
    }

    private List<String> parseCsv(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
    }

    private List<String> parseIdCsv(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }

        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
    }

    private String joinIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return "";
        }

        return ids.stream()
                .map(String::trim)
                .filter(id -> !id.isBlank())
                .collect(Collectors.joining(","));
    }

    private String joinTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return "";
        }
        return tags.stream()
                .map(String::trim)
                .filter(tag -> !tag.isBlank())
                .collect(Collectors.joining(", "));
    }

    private String buildFullTypeName(String typeName, List<String> tags) {
        String normalizedTypeName = normalizeOptionalText(typeName);
        if (normalizedTypeName == null) {
            return "";
        }

        if (tags == null || tags.isEmpty()) {
            return normalizedTypeName;
        }

        String prefix = tags.stream()
                .map(String::trim)
                .filter(tag -> !tag.isBlank())
                .collect(Collectors.joining(" "));

        if (prefix.isBlank()) {
            return normalizedTypeName;
        }

        return (prefix + " " + normalizedTypeName).trim();
    }

    private void applyResourceTypeSnapshot(Resource resource, ResourceType resourceType, List<String> tags) {
        String typeName = resourceType.getName();
        resource.setCategory(typeName);
        resource.setType(buildFullTypeName(typeName, tags));
        resource.setSubType(joinTags(tags));
        resource.setResourceTags(joinTags(tags));
        resource.setIcon(resourceType.getIcon());
    }

    private ResourceDto toResourceDto(Resource resource) {
        return new ResourceDto(
                resource.getId(),
                resource.getCategory(),
                resource.getType(),
                resource.getSubType(),
                resource.getResourceTypeId(),
                resource.getIcon(),
                parseCsv(resource.getResourceTags()),
                true,
                resource.getDescription()
        );
    }

    private InventoryItemDto toItemDto(InventoryItem item) {
        List<String> customTagIds = parseIdCsv(item.getCustomTagIds());

        Map<String, String> customTagNameById = inventoryItemCustomTagRepository.findAllById(customTagIds).stream()
            .collect(Collectors.toMap(InventoryItemCustomTag::getId, InventoryItemCustomTag::getName, (first, second) -> first));

        List<String> customTagNames = customTagIds.stream()
            .map(customTagNameById::get)
            .filter(Objects::nonNull)
            .toList();

        return new InventoryItemDto(
                item.getId(),
                item.getResourceId(),
                item.getResourceCategory(),
                item.getResourceType(),
                item.getResourceSubType(),
                item.getResourceTags(),
                item.getResourceIcon(),
                item.getResourceDescription(),
            customTagIds,
            customTagNames,
                item.getAvailableQuantity(),
                item.getPendingQuantity()
        );
    }

        private InventoryItemCustomTagDto toInventoryItemCustomTagDto(InventoryItemCustomTag tag) {
        return new InventoryItemCustomTagDto(
            tag.getId(),
            tag.getName(),
            tag.getDescription(),
            tag.getColor(),
            tag.getGraphic(),
            tag.isEditable()
        );
        }

    private ResourceTypeDto toResourceTypeDto(ResourceType type) {
        return new ResourceTypeDto(
                type.getId(),
                type.getName(),
                type.getDescription(),
                type.getIcon(),
                type.getParentTypeId(),
                type.getParentTypeName(),
                type.isEditable()
        );
    }

    private ResourceTagDto toResourceTagDto(ResourceTag tag) {
        return new ResourceTagDto(tag.getId(), tag.getName(), tag.getDescription(), tag.getColor(), tag.getGraphic(), tag.isEditable());
    }

    private void seedResourceTypes() {
        for (SeedType seedType : DEFAULT_RESOURCE_TYPES) {
            Optional<ResourceType> existing = resourceTypeRepository.findByNameIgnoreCase(seedType.name);
            if (existing.isPresent()) {
                ResourceType value = existing.get();
                value.setDescription(seedType.description);
                value.setIcon(seedType.icon);
                value.setEditable(false);
                value.setUpdatedAt(LocalDateTime.now());
                resourceTypeRepository.save(value);
                continue;
            }

            ResourceType type = new ResourceType();
            type.setName(seedType.name);
            type.setDescription(seedType.description);
            type.setIcon(seedType.icon);
            type.setEditable(false);
            type.setCreatedAt(LocalDateTime.now());
            type.setUpdatedAt(LocalDateTime.now());
            resourceTypeRepository.save(type);
        }
    }

    private void seedResourceTags() {
        for (SeedTag seedTag : DEFAULT_RESOURCE_TAGS) {
            Optional<ResourceTag> existing = resourceTagRepository.findByNameIgnoreCase(seedTag.name);
            if (existing.isPresent()) {
                ResourceTag value = existing.get();
                value.setDescription(seedTag.description);
                value.setEditable(false);
                value.setColor(normalizeTagColor(seedTag.color));
                value.setGraphic(normalizeTagGraphic(seedTag.graphic.name()));
                value.setUpdatedAt(LocalDateTime.now());
                resourceTagRepository.save(value);
                continue;
            }

            ResourceTag tag = new ResourceTag();
            tag.setName(seedTag.name);
            tag.setDescription(seedTag.description);
            tag.setColor(normalizeTagColor(seedTag.color));
            tag.setGraphic(normalizeTagGraphic(seedTag.graphic.name()));
            tag.setEditable(false);
            tag.setCreatedAt(LocalDateTime.now());
            tag.setUpdatedAt(LocalDateTime.now());
            resourceTagRepository.save(tag);
        }
    }

    private record SeedType(String name, String description, String icon) {
    }

    private record SeedTag(String name, String description, String color, TagGraphic graphic) {
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
