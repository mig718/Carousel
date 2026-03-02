package com.carousel.inventory.repository;

import com.carousel.inventory.domain.InventoryItemCustomTag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InventoryItemCustomTagRepository extends JpaRepository<InventoryItemCustomTag, String> {
    boolean existsByNameIgnoreCase(String name);
    Optional<InventoryItemCustomTag> findByNameIgnoreCase(String name);
}
