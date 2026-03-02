package com.carousel.gateway.audit;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDateTime;

@Service
public class AuditTrailService {

    private final AuditEventRepository repository;

    public AuditTrailService(AuditEventRepository repository) {
        this.repository = repository;
    }

    public Mono<Void> record(AuditEvent event) {
        event.setCreatedAt(LocalDateTime.now());
        return Mono.fromRunnable(() -> repository.save(event))
            .subscribeOn(Schedulers.boundedElastic())
            .then();
    }

    public Flux<AuditEventDto> getUserHistory(String targetEmail, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 500));
        return Mono.fromCallable(() -> repository.findByActorEmailIgnoreCaseOrderByCreatedAtDesc(targetEmail, PageRequest.of(0, safeLimit)))
            .subscribeOn(Schedulers.boundedElastic())
            .flatMapMany(Flux::fromIterable)
                .map(event -> new AuditEventDto(
                        event.getId(),
                        event.getActorEmail(),
                        event.getActionType() == null ? AuditActionType.OTHER.name() : event.getActionType().name(),
                        event.getHttpMethod(),
                        event.getRequestPath(),
                        event.getResourceType(),
                        event.getResourceId(),
                        event.getStatusCode(),
                        event.isSuccess(),
                        event.getRequestId(),
                        event.getSessionId(),
                        event.getDetails(),
                        event.getCreatedAt()
                ));
    }
}
