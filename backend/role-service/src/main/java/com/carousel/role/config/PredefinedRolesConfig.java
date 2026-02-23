package com.carousel.role.config;

import com.carousel.role.dto.RoleDto;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "carousel.roles")
public class PredefinedRolesConfig {
    private List<RoleDto> predefined = new ArrayList<>();

    public List<RoleDto> getPredefined() {
        return predefined;
    }

    public void setPredefined(List<RoleDto> predefined) {
        this.predefined = predefined;
    }
}
