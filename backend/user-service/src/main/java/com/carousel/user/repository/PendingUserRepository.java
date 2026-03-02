package com.carousel.user.repository;

import com.carousel.user.domain.PendingUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PendingUserRepository extends JpaRepository<PendingUser, String> {
    Optional<PendingUser> findByEmail(String email);
    List<PendingUser> findByEmailVerifiedTrue();
}

