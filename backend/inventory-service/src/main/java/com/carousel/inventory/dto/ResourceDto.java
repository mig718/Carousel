package com.carousel.inventory.dto;

import java.util.List;

public class ResourceDto {
    private String id;
    private String category;
    private String type;
    private String subType;
    private String resourceTypeId;
    private String icon;
    private List<String> tags;
    private boolean editable;
    private String description;

    public ResourceDto() {
    }

    public ResourceDto(String id, String category, String type, String subType, String description) {
        this.id = id;
        this.category = category;
        this.type = type;
        this.subType = subType;
        this.description = description;
    }

    public ResourceDto(String id, String category, String type, String subType, String resourceTypeId, String icon, List<String> tags, boolean editable, String description) {
        this.id = id;
        this.category = category;
        this.type = type;
        this.subType = subType;
        this.resourceTypeId = resourceTypeId;
        this.icon = icon;
        this.tags = tags;
        this.editable = editable;
        this.description = description;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getSubType() {
        return subType;
    }

    public void setSubType(String subType) {
        this.subType = subType;
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

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public boolean isEditable() {
        return editable;
    }

    public void setEditable(boolean editable) {
        this.editable = editable;
    }
}