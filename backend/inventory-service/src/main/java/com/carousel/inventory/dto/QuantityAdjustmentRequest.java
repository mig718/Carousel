package com.carousel.inventory.dto;

public class QuantityAdjustmentRequest {
    private int quantityDelta;

    public int getQuantityDelta() {
        return quantityDelta;
    }

    public void setQuantityDelta(int quantityDelta) {
        this.quantityDelta = quantityDelta;
    }
}
