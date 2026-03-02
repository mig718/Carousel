package com.carousel.inventory.dto;

public class TagGraphicOptionDto {
    private String key;
    private String label;
    private String icon;

    public TagGraphicOptionDto() {
    }

    public TagGraphicOptionDto(String key, String label, String icon) {
        this.key = key;
        this.label = label;
        this.icon = icon;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }
}
