package com.carousel.inventory.dto;

import java.util.List;

public class StyleRequest {
    private String name;
    private String description;
    private List<String> imageUrls;
    private List<String> requiredItemIds;

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
}
