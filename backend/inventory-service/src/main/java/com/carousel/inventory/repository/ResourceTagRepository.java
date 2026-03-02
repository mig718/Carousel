package com.carousel.inventory.repository;

import com.carousel.inventory.domain.ResourceTag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ResourceTagRepository extends JpaRepository<ResourceTag, String> {
    boolean existsByNameIgnoreCase(String name);
    Optional<ResourceTag> findByNameIgnoreCase(String name);
}
