package com.carousel.inventory.dto;

public class InventoryItemDto {
    private String id;
    private String name;
    private String description;
    private String resourceTypeId;
    private String resourceTypeName;
    private String resourceSubTypeId;
    private String resourceSubTypeName;
    private int availableQuantity;

    public InventoryItemDto() {
    }

    public InventoryItemDto(String id, String name, String description, String resourceTypeId, String resourceTypeName, String resourceSubTypeId, String resourceSubTypeName, int availableQuantity) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.resourceTypeId = resourceTypeId;
        this.resourceTypeName = resourceTypeName;
        this.resourceSubTypeId = resourceSubTypeId;
        this.resourceSubTypeName = resourceSubTypeName;
        this.availableQuantity = availableQuantity;
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
}
