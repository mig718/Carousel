package com.carousel.inventory.dto;

import java.util.List;

public class InventoryItemDto {
    private String id;
    private String resourceId;
    private String resourceCategory;
    private String resourceType;
    private String resourceSubType;
    private String resourceTags;
    private String resourceIcon;
    private String resourceDescription;
    private List<String> customTagIds;
    private List<String> customTagNames;
    private int availableQuantity;
    private int pendingQuantity;

    public InventoryItemDto() {
    }

    public InventoryItemDto(String id, String resourceId, String resourceCategory, String resourceType, String resourceSubType, String resourceTags, String resourceIcon, String resourceDescription, List<String> customTagIds, List<String> customTagNames, int availableQuantity, int pendingQuantity) {
        this.id = id;
        this.resourceId = resourceId;
        this.resourceCategory = resourceCategory;
        this.resourceType = resourceType;
        this.resourceSubType = resourceSubType;
        this.resourceTags = resourceTags;
        this.resourceIcon = resourceIcon;
        this.resourceDescription = resourceDescription;
        this.customTagIds = customTagIds;
        this.customTagNames = customTagNames;
        this.availableQuantity = availableQuantity;
        this.pendingQuantity = pendingQuantity;
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

    public List<String> getCustomTagIds() {
        return customTagIds;
    }

    public void setCustomTagIds(List<String> customTagIds) {
        this.customTagIds = customTagIds;
    }

    public List<String> getCustomTagNames() {
        return customTagNames;
    }

    public void setCustomTagNames(List<String> customTagNames) {
        this.customTagNames = customTagNames;
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
}
