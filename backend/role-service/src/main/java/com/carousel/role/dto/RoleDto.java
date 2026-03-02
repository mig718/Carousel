package com.carousel.role.dto;

public class RoleDto {
    private String id;
    private String name;
    private String description;
    private boolean editable;

    public RoleDto() {
    }

    public RoleDto(String id, String name, String description, boolean editable) {
        this.id = id;
        this.name = name;
        this.description = description;
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

    public boolean isEditable() {
        return editable;
    }

    public void setEditable(boolean editable) {
        this.editable = editable;
    }
}
