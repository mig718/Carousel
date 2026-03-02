package com.carousel.gateway.audit;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditEventRepository extends JpaRepository<AuditEvent, String> {
    List<AuditEvent> findByActorEmailIgnoreCaseOrderByCreatedAtDesc(String actorEmail, Pageable pageable);
}
