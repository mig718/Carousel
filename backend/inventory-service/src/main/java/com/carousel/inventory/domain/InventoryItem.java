package com.carousel.inventory.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_items")
public class InventoryItem {
    @Id
    @Column(nullable = false, updatable = false)
    private String id;
    private String resourceId;
    private String resourceCategory;
    private String resourceType;
    private String resourceSubType;
    private String resourceTags;
    private String resourceIcon;
    private String resourceDescription;
    private String customTagIds;
    private int availableQuantity;
    private int pendingQuantity;
    @Column(nullable = false)
    private LocalDateTime createdAt;
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public InventoryItem() {
    }

    public InventoryItem(String id, String resourceId, String resourceCategory, String resourceType, String resourceSubType, String resourceTags, String resourceIcon, String resourceDescription, String customTagIds, int availableQuantity, int pendingQuantity, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.resourceId = resourceId;
        this.resourceCategory = resourceCategory;
        this.resourceType = resourceType;
        this.resourceSubType = resourceSubType;
        this.resourceTags = resourceTags;
        this.resourceIcon = resourceIcon;
        this.resourceDescription = resourceDescription;
        this.customTagIds = customTagIds;
        this.availableQuantity = availableQuantity;
        this.pendingQuantity = pendingQuantity;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getResourceCategory() {
        return resourceCategory;
    }

    public void setResourceCategory(String resourceCategory) {
        this.resourceCategory = resourceCategory;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getResourceSubType() {
        return resourceSubType;
    }

    public void setResourceSubType(String resourceSubType) {
        this.resourceSubType = resourceSubType;
    }

    public String getResourceTags() {
        return resourceTags;
    }

    public void setResourceTags(String resourceTags) {
        this.resourceTags = resourceTags;
    }

    public String getResourceIcon() {
        return resourceIcon;
    }

    public void setResourceIcon(String resourceIcon) {
        this.resourceIcon = resourceIcon;
    }

    public String getResourceDescription() {
        return resourceDescription;
    }

    public void setResourceDescription(String resourceDescription) {
        this.resourceDescription = resourceDescription;
    }

    public String getCustomTagIds() {
        return customTagIds;
    }

    public void setCustomTagIds(String customTagIds) {
        this.customTagIds = customTagIds;
    }

    public int getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(int availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public int getPendingQuantity() {
        return pendingQuantity;
    }

    public void setPendingQuantity(int pendingQuantity) {
        this.pendingQuantity = pendingQuantity;
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

    @PrePersist
    void prePersist() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = createdAt;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
