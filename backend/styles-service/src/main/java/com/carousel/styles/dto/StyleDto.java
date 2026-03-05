package com.carousel.styles.dto;

import java.util.List;

public class StyleDto {
    private String id;
    private String name;
    private String description;
    private List<String> imageUrls;
    private List<String> requiredItemIds;
    private List<String> requiredItemNames;
    private boolean editable;

    public StyleDto() {
    }

    public StyleDto(String id, String name, String description, List<String> imageUrls, List<String> requiredItemIds, List<String> requiredItemNames, boolean editable) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.imageUrls = imageUrls;
        this.requiredItemIds = requiredItemIds;
        this.requiredItemNames = requiredItemNames;
        this.editable = editable;
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

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public List<String> getRequiredItemIds() {
        return requiredItemIds;
    }

    public void setRequiredItemIds(List<String> requiredItemIds) {
        this.requiredItemIds = requiredItemIds;
    }

    public List<String> getRequiredItemNames() {
        return requiredItemNames;
    }

    public void setRequiredItemNames(List<String> requiredItemNames) {
        this.requiredItemNames = requiredItemNames;
    }

    public boolean isEditable() {
        return editable;
    }

    public void setEditable(boolean editable) {
        this.editable = editable;
    }
}
