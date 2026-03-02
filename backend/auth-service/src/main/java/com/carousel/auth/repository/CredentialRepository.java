package com.carousel.auth.repository;

import com.carousel.auth.domain.Credential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
 public interface CredentialRepository extends JpaRepository<Credential, String> {
    Optional<Credential> findByEmail(String email);
}

