package com.carousel.role.repository;

import com.carousel.role.domain.UserRoleAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRoleAssignmentRepository extends JpaRepository<UserRoleAssignment, String> {
    List<UserRoleAssignment> findByUserId(String userId);
    Optional<UserRoleAssignment> findByUserIdAndRoleId(String userId, String roleId);
    List<UserRoleAssignment> findByRoleId(String roleId);
    void deleteByRoleId(String roleId);
}
