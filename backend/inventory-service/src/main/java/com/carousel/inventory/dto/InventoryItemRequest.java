package com.carousel.inventory.dto;

import java.util.List;

public class InventoryItemRequest {
    private String resourceId;
    private Integer availableQuantity;
    private Integer pendingQuantity;
    private List<String> customTagIds;

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public Integer getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(Integer availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public Integer getPendingQuantity() {
        return pendingQuantity;
    }

    public void setPendingQuantity(Integer pendingQuantity) {
        this.pendingQuantity = pendingQuantity;
    }

    public List<String> getCustomTagIds() {
        return customTagIds;
    }

    public void setCustomTagIds(List<String> customTagIds) {
        this.customTagIds = customTagIds;
    }
}
