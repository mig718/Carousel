package com.carousel.approval.repository;

import com.carousel.approval.domain.ApprovalRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, String> {
    Optional<ApprovalRequest> findByPendingUserId(String pendingUserId);
    Optional<ApprovalRequest> findByTargetUserIdAndApprovedFalse(String targetUserId);
    List<ApprovalRequest> findByApprovedFalse();
}

