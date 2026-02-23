package com.carousel.inventory.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "inventory_items")
public class InventoryItem {
    @Id
    private String id;
    private String name;
    private String description;
    private String resourceTypeId;
    private String resourceTypeName;
    private String resourceSubTypeId;
    private String resourceSubTypeName;
    private int availableQuantity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public InventoryItem() {
    }

    public InventoryItem(String id, String name, String description, String resourceTypeId, String resourceTypeName, String resourceSubTypeId, String resourceSubTypeName, int availableQuantity, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.resourceTypeId = resourceTypeId;
        this.resourceTypeName = resourceTypeName;
        this.resourceSubTypeId = resourceSubTypeId;
        this.resourceSubTypeName = resourceSubTypeName;
        this.availableQuantity = availableQuantity;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getResourceTypeId() {
        return resourceTypeId;
    }

    public void setResourceTypeId(String resourceTypeId) {
        this.resourceTypeId = resourceTypeId;
    }

    public String getResourceTypeName() {
        return resourceTypeName;
    }

    public void setResourceTypeName(String resourceTypeName) {
        this.resourceTypeName = resourceTypeName;
    }

    public String getResourceSubTypeId() {
        return resourceSubTypeId;
    }

    public void setResourceSubTypeId(String resourceSubTypeId) {
        this.resourceSubTypeId = resourceSubTypeId;
    }

    public String getResourceSubTypeName() {
        return resourceSubTypeName;
    }

    public void setResourceSubTypeName(String resourceSubTypeName) {
        this.resourceSubTypeName = resourceSubTypeName;
    }

    public int getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(int availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
