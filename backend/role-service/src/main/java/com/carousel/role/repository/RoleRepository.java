package com.carousel.role.repository;

import com.carousel.role.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {
    Optional<Role> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    void deleteByNameIgnoreCase(String name);
}
