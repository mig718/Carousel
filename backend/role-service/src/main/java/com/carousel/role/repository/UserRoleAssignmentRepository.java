package com.carousel.role.repository;

import com.carousel.role.domain.UserRoleAssignment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRoleAssignmentRepository extends MongoRepository<UserRoleAssignment, String> {
    Optional<UserRoleAssignment> findByUserEmail(String userEmail);
}
