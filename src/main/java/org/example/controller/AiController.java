package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.example.service.AiCategorizationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiCategorizationService aiCategorizationService;

    @PostMapping("/categorize")
    public ResponseEntity<String> triggerCategorization(Authentication authentication) {
        String userEmail = authentication.getName();
        aiCategorizationService.categorizeUncategorizedTransactions(userEmail);
        return ResponseEntity.ok("Categorization job completed successfully.");
    }
}
