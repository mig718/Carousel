package com.carousel.styles.dto;

public class InventoryItemDto {
    private String id;
    private String resourceType;

    public InventoryItemDto() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }
}
