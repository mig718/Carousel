package com.carousel.inventory.dto;

public class ResourceTagDto {
    private String id;
    private String name;
    private String description;
    private String color;
    private String graphic;
    private boolean editable;

    public ResourceTagDto() {
    }

    public ResourceTagDto(String id, String name, String description, String color, String graphic, boolean editable) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.color = color;
        this.graphic = graphic;
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

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getGraphic() {
        return graphic;
    }

    public void setGraphic(String graphic) {
        this.graphic = graphic;
    }

    public boolean isEditable() {
        return editable;
    }

    public void setEditable(boolean editable) {
        this.editable = editable;
    }
}
