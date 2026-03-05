package com.carousel.styles.service;

import com.carousel.styles.client.InventoryServiceClient;
import com.carousel.styles.client.RoleServiceClient;
import com.carousel.styles.client.UserServiceClient;
import com.carousel.styles.domain.Style;
import com.carousel.styles.dto.InventoryItemDto;
import com.carousel.styles.dto.StyleDto;
import com.carousel.styles.dto.StyleRequest;
import com.carousel.styles.dto.UserDto;
import com.carousel.styles.repository.StyleRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class StylesManagementService {
    private final StyleRepository styleRepository;
    private final RoleServiceClient roleServiceClient;
    private final UserServiceClient userServiceClient;
    private final InventoryServiceClient inventoryServiceClient;
    private final JdbcTemplate jdbcTemplate;

    public StylesManagementService(
            StyleRepository styleRepository,
            RoleServiceClient roleServiceClient,
            UserServiceClient userServiceClient,
            InventoryServiceClient inventoryServiceClient,
            JdbcTemplate jdbcTemplate
    ) {
        this.styleRepository = styleRepository;
        this.roleServiceClient = roleServiceClient;
        this.userServiceClient = userServiceClient;
        this.inventoryServiceClient = inventoryServiceClient;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    void ensureStyleTextColumns() {
        jdbcTemplate.execute("ALTER TABLE IF EXISTS inventory_styles ALTER COLUMN description TYPE TEXT");
        jdbcTemplate.execute("ALTER TABLE IF EXISTS inventory_styles ALTER COLUMN image_urls TYPE TEXT");
        jdbcTemplate.execute("ALTER TABLE IF EXISTS inventory_styles ALTER COLUMN required_item_ids TYPE TEXT");
    }

    public List<StyleDto> getStyles(String requesterEmail) {
        ensureStyleAccess(requesterEmail);

        return styleRepository.findAll().stream()
                .sorted(Comparator.comparing(Style::getName, String.CASE_INSENSITIVE_ORDER))
                .map(style -> toStyleDto(style, requesterEmail))
                .toList();
    }

    public StyleDto getStyleById(String styleId, String requesterEmail) {
        ensureStyleAccess(requesterEmail);

        Style style = styleRepository.findById(styleId)
                .orElseThrow(() -> new RuntimeException("Style not found"));

        return toStyleDto(style, requesterEmail);
    }

    public StyleDto createStyle(StyleRequest request, String requesterEmail) {
        ensureStyleManagementAccess(requesterEmail);

        String name = requiredText(request.getName(), "Style name is required");
        String description = requiredText(request.getDescription(), "Style description is required");
        List<String> imageUrls = normalizeImageUrls(request.getImageUrls());
        List<String> requiredItemIds = resolveRequiredItemIds(request.getRequiredItemIds(), requesterEmail);

        if (styleRepository.existsByNameIgnoreCase(name)) {
            throw new RuntimeException("Style already exists");
        }

        Style style = new Style();
        style.setName(name);
        style.setDescription(description);
        style.setImageUrls(joinMultiline(imageUrls));
        style.setRequiredItemIds(joinIds(requiredItemIds));
        style.setCreatedAt(LocalDateTime.now());
        style.setUpdatedAt(LocalDateTime.now());

        return toStyleDto(styleRepository.save(style), requesterEmail);
    }

    public StyleDto updateStyle(String styleId, StyleRequest request, String requesterEmail) {
        ensureStyleManagementAccess(requesterEmail);

        Style existing = styleRepository.findById(styleId)
                .orElseThrow(() -> new RuntimeException("Style not found"));

        String name = requiredText(request.getName(), "Style name is required");
        String description = requiredText(request.getDescription(), "Style description is required");
        List<String> imageUrls = normalizeImageUrls(request.getImageUrls());
        List<String> requiredItemIds = resolveRequiredItemIds(request.getRequiredItemIds(), requesterEmail);

        Optional<Style> conflict = styleRepository.findByNameIgnoreCase(name);
        if (conflict.isPresent() && !conflict.get().getId().equals(existing.getId())) {
            throw new RuntimeException("Style already exists");
        }

        existing.setName(name);
        existing.setDescription(description);
        existing.setImageUrls(joinMultiline(imageUrls));
        existing.setRequiredItemIds(joinIds(requiredItemIds));
        existing.setUpdatedAt(LocalDateTime.now());

        return toStyleDto(styleRepository.save(existing), requesterEmail);
    }

    public void deleteStyle(String styleId, String requesterEmail) {
        ensureStyleManagementAccess(requesterEmail);

        Style existing = styleRepository.findById(styleId)
                .orElseThrow(() -> new RuntimeException("Style not found"));

        styleRepository.delete(existing);
    }

    private void ensureStyleAccess(String requesterEmail) {
        AuthorizationContext context = resolveAuthorizationContext(requesterEmail);

        if (context.isAdmin) {
            return;
        }

        if (context.hasAnyRole("poweruser", "stylesuser", "stylesmanager")) {
            return;
        }

        throw new RuntimeException("Insufficient role privileges to access styles");
    }

    private void ensureStyleManagementAccess(String requesterEmail) {
        AuthorizationContext context = resolveAuthorizationContext(requesterEmail);

        if (context.isAdmin) {
            return;
        }

        if (context.hasAnyRole("poweruser", "stylesmanager")) {
            return;
        }

        throw new RuntimeException("Insufficient role privileges to manage styles");
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

    private List<String> resolveRequiredItemIds(List<String> requiredItemIds, String requesterEmail) {
        List<String> normalizedIds = parseNormalizedIds(requiredItemIds);
        if (normalizedIds.isEmpty()) {
            return List.of();
        }

        for (String id : normalizedIds) {
            try {
                inventoryServiceClient.getItemById(id, requesterEmail);
            } catch (Exception ex) {
                throw new RuntimeException("Inventory item not found for style requirement: " + id);
            }
        }

        return normalizedIds;
    }

    private StyleDto toStyleDto(Style style, String requesterEmail) {
        List<String> requiredItemIds = parseIdCsv(style.getRequiredItemIds());
        List<String> requiredItemNames = requiredItemIds.stream()
                .map(itemId -> resolveItemName(itemId, requesterEmail))
                .filter(Objects::nonNull)
                .toList();

        return new StyleDto(
                style.getId(),
                style.getName(),
                style.getDescription(),
                parseMultiline(style.getImageUrls()),
                requiredItemIds,
                requiredItemNames,
                true
        );
    }

    private String resolveItemName(String itemId, String requesterEmail) {
        try {
            InventoryItemDto item = inventoryServiceClient.getItemById(itemId, requesterEmail);
            return item == null ? null : item.getResourceType();
        } catch (Exception ex) {
            return null;
        }
    }

    private List<String> normalizeImageUrls(List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return List.of();
        }

        return imageUrls.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();
    }

    private List<String> parseNormalizedIds(List<String> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }

        return values.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();
    }

    private String requiredText(String text, String message) {
        if (text == null || text.isBlank()) {
            throw new RuntimeException(message);
        }
        return text.trim();
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

    private List<String> parseMultiline(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        return Arrays.stream(value.split("\\R"))
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .toList();
    }

    private String joinMultiline(List<String> values) {
        if (values == null || values.isEmpty()) {
            return "";
        }

        return values.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .reduce((left, right) -> left + "\n" + right)
                .orElse("");
    }

    private String joinIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return "";
        }

        return ids.stream()
                .map(String::trim)
                .filter(id -> !id.isBlank())
                .reduce((left, right) -> left + "," + right)
                .orElse("");
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
