package com.carousel.inventory.repository;

import com.carousel.inventory.domain.InventoryItem;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface InventoryItemRepository extends MongoRepository<InventoryItem, String> {
}
