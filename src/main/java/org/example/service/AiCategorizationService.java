package org.example.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.entity.AppUser;
import org.example.entity.Transaction;
import org.example.repository.AppUserRepository;
import org.example.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiCategorizationService {

    private final TransactionRepository transactionRepository;
    private final AppUserRepository appUserRepository;

    @Value("${ai.llm.api-key}")
    private String apiKey;

    @Value("${ai.llm.url}")
    private String apiUrl;

    private final WebClient webClient = WebClient.builder().build();

    @Transactional
    public void categorizeUncategorizedTransactions(String userEmail) {
        AppUser user = appUserRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Transaction> pendingTransactions = transactionRepository.findByUserIdAndIsAiCategorizedFalse(user.getId());

        if (pendingTransactions.isEmpty()) {
            log.info("No uncategorized transactions for user {}", userEmail);
            return;
        }

        // In a production app, we would batch these to avoid rate limits and reduce cost.
        // For demonstration, we'll process them one by one.
        for (Transaction t : pendingTransactions) {
            String category = promptLlmForCategory(t.getRawDescription());
            t.setCategory(category);
            t.setIsAiCategorized(true);
        }

        transactionRepository.saveAll(pendingTransactions);
        log.info("Successfully categorized {} transactions for user {}", pendingTransactions.size(), userEmail);
    }

    private String promptLlmForCategory(String rawDescription) {
        // Constructing a lightweight prompt asking the LLM to output a single word category
        String prompt = String.format(
            "You are a financial categorization AI. " +
            "Given the transaction description: '%s', categorize it into exactly ONE of these categories: " +
            "Groceries, Utilities, Entertainment, Dining, Transport, Health, Income, Other. " +
            "Reply with ONLY the category word.", 
            rawDescription
        );

        try {
            Map<String, Object> requestBody = Map.of(
                "model", "gpt-3.5-turbo",
                "messages", List.of(
                    Map.of("role", "user", "content", prompt)
                ),
                "temperature", 0.0,
                "max_tokens", 10
            );

            // Making a non-blocking web request, then blocking to await the result for simplicity in this example
            Map response = webClient.post()
                    .uri(apiUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    String category = ((String) message.get("content")).trim();
                    log.info("Categorized '{}' as '{}'", rawDescription, category);
                    return category;
                }
            }
        } catch (Exception e) {
            log.error("Failed to prompt LLM for category. Falling back to 'Other'.", e);
        }

        return "Other"; // Fallback
    }
}
