package com.carousel.inventory.controller;

import com.carousel.inventory.dto.*;
import com.carousel.inventory.service.InventoryManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@Tag(name = "Inventory Management", description = "Manage inventory items and resource types")
public class InventoryController {
    private final InventoryManagementService inventoryService;

    public InventoryController(InventoryManagementService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/types")
    @Operation(summary = "Get resource types", description = "List all resource types and subtypes")
    public ResponseEntity<List<ResourceTypeDto>> getTypes(@RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.getAllTypes(requesterEmail));
    }

    @GetMapping("/icons")
    @Operation(summary = "Get icon collection", description = "List common jewelry icons available for type/subtype assignment")
    public ResponseEntity<List<String>> getIcons() {
        return ResponseEntity.ok(inventoryService.getIconCollection());
    }

    @PostMapping("/types")
    @Operation(summary = "Create type or subtype", description = "Create resource type or subtype - InventoryManager/InventoryAdmin/Admin only")
    public ResponseEntity<ResourceTypeDto> createType(@RequestBody ResourceTypeRequest request, @RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.createType(request, requesterEmail));
    }

    @PutMapping("/types/{typeId}")
    @Operation(summary = "Update type or subtype", description = "Update resource type metadata - InventoryManager/InventoryAdmin/Admin only")
    public ResponseEntity<ResourceTypeDto> updateType(
            @PathVariable String typeId,
            @RequestBody ResourceTypeRequest request,
            @RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.updateType(typeId, request, requesterEmail));
    }

    @GetMapping("/items")
    @Operation(summary = "Get inventory items", description = "List inventory items and available quantities")
    public ResponseEntity<List<InventoryItemDto>> getItems(@RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.getItems(requesterEmail));
    }

    @PostMapping("/items")
    @Operation(summary = "Create inventory item", description = "Create inventory item - InventoryManager/InventoryUser/InventoryAdmin/Admin")
    public ResponseEntity<InventoryItemDto> createItem(@RequestBody InventoryItemRequest request, @RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.createItem(request, requesterEmail));
    }

    @PutMapping("/items/{itemId}")
    @Operation(summary = "Update inventory item", description = "Update inventory item details - InventoryManager/InventoryUser/InventoryAdmin/Admin")
    public ResponseEntity<InventoryItemDto> updateItem(
            @PathVariable String itemId,
            @RequestBody InventoryItemRequest request,
            @RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.updateItem(itemId, request, requesterEmail));
    }

    @PatchMapping("/items/{itemId}/quantity")
    @Operation(summary = "Adjust quantity", description = "Adjust available quantity by delta - InventoryManager/InventoryUser/InventoryAdmin/Admin")
    public ResponseEntity<InventoryItemDto> adjustQuantity(
            @PathVariable String itemId,
            @RequestBody QuantityAdjustmentRequest request,
            @RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.adjustQuantity(itemId, request.getQuantityDelta(), requesterEmail));
    }
}
