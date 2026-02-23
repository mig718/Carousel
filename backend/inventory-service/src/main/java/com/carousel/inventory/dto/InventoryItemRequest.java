package com.carousel.inventory.dto;

public class InventoryItemRequest {
    private String name;
    private String description;
    private String resourceTypeId;
    private String resourceSubTypeId;
    private Integer availableQuantity;

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

    public String getResourceSubTypeId() {
        return resourceSubTypeId;
    }

    public void setResourceSubTypeId(String resourceSubTypeId) {
        this.resourceSubTypeId = resourceSubTypeId;
    }

    public Integer getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(Integer availableQuantity) {
        this.availableQuantity = availableQuantity;
    }
}
