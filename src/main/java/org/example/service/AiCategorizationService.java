package org.example.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AiCategorizationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.ollama.url}")
    private String ollamaUrl;

    @Value("${ai.ollama.model}")
    private String ollamaModel;

    private static final List<String> CATEGORIES = List.of(
            "Groceries", "Dining", "Transport", "Utilities", "Rent",
            "Shopping", "Entertainment", "Health", "Travel", "Income", "Other"
    );

    public AiCategorizationService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public String categorizeTransaction(String description) {
        String prompt = String.format(
            "Based on the transaction description, choose the single best category from this list: %s. " +
            "Description: \"%s\". Respond with only the category name, nothing else.",
            String.join(", ", CATEGORIES),
            description
        );

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = Map.of(
                "model", ollamaModel,
                "prompt", prompt,
                "stream", false // We want the full response at once
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(ollamaUrl, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                // Ollama's non-streaming response is a series of JSON objects, one per line. We only need the last one.
                String[] jsonResponses = response.getBody().split("\n");
                String lastJsonResponse = jsonResponses[jsonResponses.length - 1];
                
                Map<String, Object> responseMap = objectMapper.readValue(lastJsonResponse, Map.class);
                String category = ((String) responseMap.get("response")).trim();

                // Clean up the response in case the model adds quotes
                category = category.replace("\"", "");

                if (CATEGORIES.contains(category)) {
                    log.info("Successfully categorized '{}' as '{}' using Ollama.", description, category);
                    return category;
                } else {
                    log.warn("Ollama returned an invalid or unexpected category: {}", category);
                }
            }
            return "Uncategorized";
        } catch (Exception e) {
            log.error("Error calling Ollama API: {}", e.getMessage());
            return "Uncategorized";
        }
    }
}