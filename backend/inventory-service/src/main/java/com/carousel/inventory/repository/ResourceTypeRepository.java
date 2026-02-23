package com.carousel.inventory.repository;

import com.carousel.inventory.domain.ResourceType;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ResourceTypeRepository extends MongoRepository<ResourceType, String> {
    boolean existsByNameIgnoreCase(String name);
    List<ResourceType> findByParentTypeId(String parentTypeId);
}
