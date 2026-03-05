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
@Tag(name = "Inventory Management", description = "Manage resources and inventory item quantities")
public class InventoryController {
    private final InventoryManagementService inventoryService;

    public InventoryController(InventoryManagementService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/resources")
    @Operation(summary = "Get resources", description = "List all resources")
    public ResponseEntity<List<ResourceDto>> getResources(@RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.getAllResources(requesterEmail));
    }

    @GetMapping("/resource-types")
    @Operation(summary = "Get resource types", description = "List resource type definitions")
    public ResponseEntity<List<ResourceTypeDto>> getResourceTypes(@RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.getResourceTypes(requesterEmail));
    }

    @PostMapping("/resource-types")
    @Operation(summary = "Create resource type", description = "Create a custom resource type")
    public ResponseEntity<ResourceTypeDto> createResourceType(@RequestBody ResourceTypeRequest request, @RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.createResourceType(request, requesterEmail));
    }

    @PutMapping("/resource-types/{resourceTypeId}")
    @Operation(summary = "Update resource type", description = "Update a custom resource type")
    public ResponseEntity<ResourceTypeDto> updateResourceType(
            @PathVariable String resourceTypeId,
            @RequestBody ResourceTypeRequest request,
            @RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.updateResourceType(resourceTypeId, request, requesterEmail));
    }

    @DeleteMapping("/resource-types/{resourceTypeId}")
    @Operation(summary = "Delete resource type", description = "Delete a custom resource type")
    public ResponseEntity<Void> deleteResourceType(@PathVariable String resourceTypeId, @RequestParam String requesterEmail) {
        inventoryService.deleteResourceType(resourceTypeId, requesterEmail);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/resource-tags")
    @Operation(summary = "Get resource tags", description = "List resource tags")
    public ResponseEntity<List<ResourceTagDto>> getResourceTags(@RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.getResourceTags(requesterEmail));
    }

    @PostMapping("/resource-tags")
    @Operation(summary = "Create resource tag", description = "Create a custom resource tag")
    public ResponseEntity<ResourceTagDto> createResourceTag(@RequestBody ResourceTagRequest request, @RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.createResourceTag(request, requesterEmail));
    }

    @PutMapping("/resource-tags/{resourceTagId}")
    @Operation(summary = "Update resource tag", description = "Update a custom resource tag")
    public ResponseEntity<ResourceTagDto> updateResourceTag(
            @PathVariable String resourceTagId,
            @RequestBody ResourceTagRequest request,
            @RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.updateResourceTag(resourceTagId, request, requesterEmail));
    }

    @DeleteMapping("/resource-tags/{resourceTagId}")
    @Operation(summary = "Delete resource tag", description = "Delete a custom resource tag")
    public ResponseEntity<Void> deleteResourceTag(@PathVariable String resourceTagId, @RequestParam String requesterEmail) {
        inventoryService.deleteResourceTag(resourceTagId, requesterEmail);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/resource-icons")
    @Operation(summary = "Get icon library", description = "List available icons for resource types")
    public ResponseEntity<List<String>> getResourceIcons(@RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.getIconLibrary(requesterEmail));
    }

    @GetMapping("/tag-graphics")
    @Operation(summary = "Get tag graphics", description = "List available enum graphics for resource and inventory tags")
    public ResponseEntity<List<TagGraphicOptionDto>> getTagGraphics(@RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.getTagGraphicOptions(requesterEmail));
    }

    @GetMapping("/resources/catalog")
    @Operation(summary = "Get predefined resource catalog", description = "List predefined categories with types and subtypes")
    public ResponseEntity<List<ResourceCatalogDto>> getResourceCatalog(@RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.getResourceCatalog(requesterEmail));
    }

    @PostMapping("/resources")
    @Operation(summary = "Create resource", description = "Create resource - InventoryManager/PowerUser/Admin only")
    public ResponseEntity<ResourceDto> createResource(@RequestBody ResourceRequest request, @RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.createResource(request, requesterEmail));
    }

    @PutMapping("/resources/{resourceId}")
    @Operation(summary = "Update resource", description = "Update resource metadata - InventoryManager/PowerUser/Admin only")
    public ResponseEntity<ResourceDto> updateResource(
            @PathVariable String resourceId,
            @RequestBody ResourceRequest request,
            @RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.updateResource(resourceId, request, requesterEmail));
    }

    @GetMapping("/items")
    @Operation(summary = "Get inventory items", description = "List inventory items and available/pending quantities")
    public ResponseEntity<List<InventoryItemDto>> getItems(@RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.getItems(requesterEmail));
    }

    @GetMapping("/items/{itemId}")
    @Operation(summary = "Get inventory item details", description = "Fetch a single inventory item by ID")
    public ResponseEntity<InventoryItemDto> getItemById(@PathVariable String itemId, @RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.getItemById(itemId, requesterEmail));
    }

    @PostMapping("/items")
    @Operation(summary = "Create inventory item", description = "Create inventory item as an instance of a resource")
    public ResponseEntity<InventoryItemDto> createItem(@RequestBody InventoryItemRequest request, @RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.createItem(request, requesterEmail));
    }

    @PutMapping("/items/{itemId}")
    @Operation(summary = "Update inventory item", description = "Update inventory item details - InventoryManager/InventoryUser/PowerUser/Admin")
    public ResponseEntity<InventoryItemDto> updateItem(
            @PathVariable String itemId,
            @RequestBody InventoryItemRequest request,
            @RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.updateItem(itemId, request, requesterEmail));
    }

    @PatchMapping("/items/{itemId}/quantity")
    @Operation(summary = "Adjust quantity", description = "Adjust available quantity by delta - InventoryManager/InventoryUser/PowerUser/Admin")
    public ResponseEntity<InventoryItemDto> adjustQuantity(
            @PathVariable String itemId,
            @RequestBody QuantityAdjustmentRequest request,
            @RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.adjustQuantity(itemId, request.getQuantityDelta(), requesterEmail));
    }

    @GetMapping("/item-custom-tags")
    @Operation(summary = "Get inventory item custom tags", description = "List reusable custom tags for inventory items")
    public ResponseEntity<List<InventoryItemCustomTagDto>> getItemCustomTags(@RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.getItemCustomTags(requesterEmail));
    }

    @PostMapping("/item-custom-tags")
    @Operation(summary = "Create inventory item custom tag", description = "Create reusable custom tag for inventory items")
    public ResponseEntity<InventoryItemCustomTagDto> createItemCustomTag(
            @RequestBody InventoryItemCustomTagRequest request,
            @RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.createItemCustomTag(request, requesterEmail));
    }

    @PutMapping("/item-custom-tags/{tagId}")
    @Operation(summary = "Update inventory item custom tag", description = "Update reusable inventory item custom tag")
    public ResponseEntity<InventoryItemCustomTagDto> updateItemCustomTag(
            @PathVariable String tagId,
            @RequestBody InventoryItemCustomTagRequest request,
            @RequestParam String requesterEmail) {
        return ResponseEntity.ok(inventoryService.updateItemCustomTag(tagId, request, requesterEmail));
    }

    @DeleteMapping("/item-custom-tags/{tagId}")
    @Operation(summary = "Delete inventory item custom tag", description = "Delete reusable inventory item custom tag")
    public ResponseEntity<Void> deleteItemCustomTag(@PathVariable String tagId, @RequestParam String requesterEmail) {
        inventoryService.deleteItemCustomTag(tagId, requesterEmail);
        return ResponseEntity.noContent().build();
    }

}
