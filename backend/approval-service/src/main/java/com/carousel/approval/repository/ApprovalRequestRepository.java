package com.carousel.approval.repository;

import com.carousel.approval.domain.ApprovalRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovalRequestRepository extends MongoRepository<ApprovalRequest, String> {
    Optional<ApprovalRequest> findByPendingUserId(String pendingUserId);
    List<ApprovalRequest> findByApprovedFalse();
}

