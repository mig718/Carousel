package com.carousel.inventory.dto;

import java.util.List;

public class ResourceCatalogDto {
    private String category;
    private List<ResourceCatalogTypeDto> types;

    public ResourceCatalogDto() {
    }

    public ResourceCatalogDto(String category, List<ResourceCatalogTypeDto> types) {
        this.category = category;
        this.types = types;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public List<ResourceCatalogTypeDto> getTypes() {
        return types;
    }

    public void setTypes(List<ResourceCatalogTypeDto> types) {
        this.types = types;
    }

    public static class ResourceCatalogTypeDto {
        private String name;
        private List<String> subTypes;

        public ResourceCatalogTypeDto() {
        }

        public ResourceCatalogTypeDto(String name, List<String> subTypes) {
            this.name = name;
            this.subTypes = subTypes;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public List<String> getSubTypes() {
            return subTypes;
        }

        public void setSubTypes(List<String> subTypes) {
            this.subTypes = subTypes;
        }
    }
}