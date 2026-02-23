package com.carousel.inventory;

import com.carousel.inventory.client.RoleServiceClient;
import com.carousel.inventory.client.UserServiceClient;
import com.carousel.inventory.domain.InventoryItem;
import com.carousel.inventory.domain.ResourceType;
import com.carousel.inventory.dto.InventoryItemRequest;
import com.carousel.inventory.dto.ResourceTypeRequest;
import com.carousel.inventory.dto.UserDto;
import com.carousel.inventory.repository.InventoryItemRepository;
import com.carousel.inventory.repository.ResourceTypeRepository;
import com.carousel.inventory.service.InventoryManagementService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class InventoryManagementServiceTest {

    @Mock
    private ResourceTypeRepository resourceTypeRepository;

    @Mock
    private InventoryItemRepository inventoryItemRepository;

    @Mock
    private RoleServiceClient roleServiceClient;

    @Mock
    private UserServiceClient userServiceClient;

    @InjectMocks
    private InventoryManagementService inventoryManagementService;

    @Test
    public void createTypeAllowsAdminWithoutExplicitInventoryRole() {
        ResourceTypeRequest request = new ResourceTypeRequest();
        request.setName("Metal");
        request.setDescription("Metal resources");
        request.setIcon("🪙");

        when(userServiceClient.getUserByEmail("admin@example.com"))
                .thenReturn(new UserDto("1", "Admin", "User", "admin@example.com", "Admin"));
        when(roleServiceClient.getRolesForUser("admin@example.com")).thenReturn(List.of("Support"));
        when(resourceTypeRepository.existsByNameIgnoreCase("Metal")).thenReturn(false);
        when(resourceTypeRepository.save(any(ResourceType.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = inventoryManagementService.createType(request, "admin@example.com");
        assertEquals("Metal", result.getName());
    }

    @Test
    public void createTypeRejectsInventoryUser() {
        ResourceTypeRequest request = new ResourceTypeRequest();
        request.setName("Stone");
        request.setDescription("Stone resources");
        request.setIcon("💎");

        when(userServiceClient.getUserByEmail("inventory.user@example.com"))
                .thenReturn(new UserDto("2", "Inventory", "User", "inventory.user@example.com", "User"));
        when(roleServiceClient.getRolesForUser("inventory.user@example.com")).thenReturn(List.of("InventoryUser"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> inventoryManagementService.createType(request, "inventory.user@example.com"));
        assertEquals("Insufficient role privileges to manage resource types", ex.getMessage());
    }

    @Test
    public void createItemAllowsInventoryUserAndStoresQuantity() {
        InventoryItemRequest request = new InventoryItemRequest();
        request.setName("Round Diamond");
        request.setDescription("1ct round diamond");
        request.setResourceTypeId("type-1");
        request.setAvailableQuantity(25);

        ResourceType type = new ResourceType();
        type.setId("type-1");
        type.setName("Stone");

        when(userServiceClient.getUserByEmail("inventory.user@example.com"))
                .thenReturn(new UserDto("2", "Inventory", "User", "inventory.user@example.com", "User"));
        when(roleServiceClient.getRolesForUser("inventory.user@example.com")).thenReturn(List.of("InventoryUser"));
        when(resourceTypeRepository.findById("type-1")).thenReturn(Optional.of(type));
        when(inventoryItemRepository.save(any(InventoryItem.class))).thenAnswer(invocation -> {
            InventoryItem saved = invocation.getArgument(0);
            saved.setId("item-1");
            return saved;
        });

        var result = inventoryManagementService.createItem(request, "inventory.user@example.com");
        assertEquals("item-1", result.getId());
        assertEquals(25, result.getAvailableQuantity());
        assertEquals("Stone", result.getResourceTypeName());
    }
}
