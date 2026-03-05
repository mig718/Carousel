package com.carousel.styles.controller;

import com.carousel.styles.dto.StyleDto;
import com.carousel.styles.dto.StyleRequest;
import com.carousel.styles.service.StylesManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@Tag(name = "Styles Management", description = "Manage style templates for complete jewelry items")
public class StylesController {
    private final StylesManagementService stylesService;

    public StylesController(StylesManagementService stylesService) {
        this.stylesService = stylesService;
    }

    @GetMapping("/styles")
    @Operation(summary = "Get styles", description = "List style templates for complete jewelry items")
    public ResponseEntity<List<StyleDto>> getStyles(@RequestParam String requesterEmail) {
        return ResponseEntity.ok(stylesService.getStyles(requesterEmail));
    }

    @GetMapping("/styles/{styleId}")
    @Operation(summary = "Get style details", description = "Fetch a single style template by ID")
    public ResponseEntity<StyleDto> getStyleById(@PathVariable String styleId, @RequestParam String requesterEmail) {
        return ResponseEntity.ok(stylesService.getStyleById(styleId, requesterEmail));
    }

    @PostMapping("/styles")
    @Operation(summary = "Create style", description = "Create a style template with images and required inventory items")
    public ResponseEntity<StyleDto> createStyle(@RequestBody StyleRequest request, @RequestParam String requesterEmail) {
        return ResponseEntity.ok(stylesService.createStyle(request, requesterEmail));
    }

    @PutMapping("/styles/{styleId}")
    @Operation(summary = "Update style", description = "Update style template details and required inventory items")
    public ResponseEntity<StyleDto> updateStyle(
            @PathVariable String styleId,
            @RequestBody StyleRequest request,
            @RequestParam String requesterEmail) {
        return ResponseEntity.ok(stylesService.updateStyle(styleId, request, requesterEmail));
    }

    @DeleteMapping("/styles/{styleId}")
    @Operation(summary = "Delete style", description = "Delete a style template")
    public ResponseEntity<Void> deleteStyle(@PathVariable String styleId, @RequestParam String requesterEmail) {
        stylesService.deleteStyle(styleId, requesterEmail);
        return ResponseEntity.noContent().build();
    }
}
