package com.carousel.inventory.dto;

public class ResourceTypeDto {
    private String id;
    private String name;
    private String description;
    private String icon;
    private String parentTypeId;
    private String parentTypeName;

    public ResourceTypeDto() {
    }

    public ResourceTypeDto(String id, String name, String description, String icon, String parentTypeId, String parentTypeName) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.parentTypeId = parentTypeId;
        this.parentTypeName = parentTypeName;
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

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getParentTypeId() {
        return parentTypeId;
    }

    public void setParentTypeId(String parentTypeId) {
        this.parentTypeId = parentTypeId;
    }

    public String getParentTypeName() {
        return parentTypeName;
    }

    public void setParentTypeName(String parentTypeName) {
        this.parentTypeName = parentTypeName;
    }
}
