package com.carousel.styles.repository;

import com.carousel.styles.domain.Style;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StyleRepository extends JpaRepository<Style, String> {
    boolean existsByNameIgnoreCase(String name);
    Optional<Style> findByNameIgnoreCase(String name);
}
