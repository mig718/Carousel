package com.carousel.gateway.audit;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/audit")
@CrossOrigin(
    origins = {"http://localhost:3000", "http://localhost:8000"},
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS},
    allowCredentials = "true"
)
@Tag(name = "Audit Trail", description = "Admin audit history and user action tracking")
@Validated
public class AuditController {

    private final AuditTrailService auditTrailService;
    private final UserAccessClient userAccessClient;
    private final JwtIdentityService jwtIdentityService;

    public AuditController(
            AuditTrailService auditTrailService,
            UserAccessClient userAccessClient,
            JwtIdentityService jwtIdentityService
    ) {
        this.auditTrailService = auditTrailService;
        this.userAccessClient = userAccessClient;
        this.jwtIdentityService = jwtIdentityService;
    }

    @GetMapping("/history")
    @Operation(summary = "Get user action history", description = "Admin only endpoint to list actions performed by a specific user")
    public Mono<ResponseEntity<List<AuditEventDto>>> getHistory(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestParam @NotBlank @Email String requesterEmail,
            @RequestParam @NotBlank @Email String targetEmail,
            @RequestParam(defaultValue = "200") @Min(1) @Max(500) int limit
    ) {
        String authenticatedEmail = jwtIdentityService.extractEmail(authorization).orElse(null);
        if (authenticatedEmail == null || !Objects.equals(authenticatedEmail.toLowerCase(), requesterEmail.toLowerCase())) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }

        return userAccessClient.isAdmin(requesterEmail)
                .flatMap(isAdmin -> {
                    if (!isAdmin) {
                        return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).<List<AuditEventDto>>build());
                    }
                    return auditTrailService.getUserHistory(targetEmail, limit)
                            .collectList()
                            .map(ResponseEntity::ok);
                });
    }

    @PostMapping("/logout")
    @Operation(summary = "Track logout", description = "No-op endpoint used to track user logout action in audit trail")
    public Mono<ResponseEntity<String>> logoutMarker(
            ServerHttpRequest request,
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestParam @NotBlank @Email String requesterEmail
    ) {
        String authenticatedEmail = jwtIdentityService.extractEmail(authorization).orElse(null);
        if (authenticatedEmail == null || !Objects.equals(authenticatedEmail.toLowerCase(), requesterEmail.toLowerCase())) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }

        AuditEvent event = new AuditEvent();
        event.setActorEmail(requesterEmail.toLowerCase());
        event.setActionType(AuditActionType.LOGOUT);
        event.setHttpMethod("POST");
        event.setRequestPath(request.getPath().value());
        event.setResourceType("audit");
        event.setResourceId("");
        event.setStatusCode(200);
        event.setSuccess(true);
        event.setRequestId(request.getHeaders().getFirst("X-Request-Id"));
        event.setSessionId(request.getHeaders().getFirst("X-Session-Id"));
        event.setDetails("");

        return auditTrailService.record(event)
                .thenReturn(ResponseEntity.ok("Logout tracked"));
    }
}
