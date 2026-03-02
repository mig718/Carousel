package com.carousel.gateway.audit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class UserAccessClient {

    private final WebClient webClient;

    public UserAccessClient(@Value("${carousel.clients.user-service-url}") String userServiceUrl) {
        this.webClient = WebClient.builder().baseUrl(userServiceUrl).build();
    }

    public Mono<Boolean> isAdmin(String email) {
        return webClient
                .get()
                .uri(uriBuilder -> uriBuilder.path("/email/{email}").build(email))
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> Mono.error(new RuntimeException("Failed to resolve requester access level")))
                .bodyToMono(UserDto.class)
                .map(userDto -> userDto != null && userDto.accessLevel() != null && "Admin".equalsIgnoreCase(userDto.accessLevel()));
    }

    private record UserDto(String id, String firstName, String lastName, String email, String accessLevel) {
    }
}
