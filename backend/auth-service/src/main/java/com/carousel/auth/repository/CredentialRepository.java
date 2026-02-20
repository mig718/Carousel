package com.carousel.auth.repository;

import com.carousel.auth.domain.Credential;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CredentialRepository extends MongoRepository<Credential, String> {
    Optional<Credential> findByEmail(String email);
}

