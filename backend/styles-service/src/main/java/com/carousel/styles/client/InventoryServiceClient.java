package com.carousel.styles.client;

import com.carousel.styles.dto.InventoryItemDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(
    name = "inventory-service",
    url = "${carousel.clients.inventory-service-url:http://localhost:8005}",
    path = "/api/inventory"
)
public interface InventoryServiceClient {
    @GetMapping("/items/{itemId}")
    InventoryItemDto getItemById(@PathVariable String itemId, @RequestParam String requesterEmail);
}
