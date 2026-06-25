package org.example.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.entity.Transaction;
import org.example.repository.TransactionRepository;
import org.example.service.AiCategorizationService;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransactionCategorizationJob {

    private final TransactionRepository transactionRepository;
    private final AiCategorizationService aiCategorizationService;
    private static final int BATCH_SIZE = 5; // Process 5 transactions at a time to respect free tier limits

    @Scheduled(fixedDelay = 60000) // Run every minute
    @Transactional
    public void categorizeTransactions() {
        log.info("Starting AI categorization job...");

        // Fetch a small batch of uncategorized transactions
        List<Transaction> uncategorized = transactionRepository.findByIsAiCategorizedFalse(PageRequest.of(0, BATCH_SIZE));

        if (uncategorized.isEmpty()) {
            log.info("No new transactions to categorize. Job finished.");
            return;
        }

        log.info("Found {} transactions to categorize in this batch.", uncategorized.size());
        int successCount = 0;

        for (Transaction transaction : uncategorized) {
            String category = aiCategorizationService.categorizeTransaction(transaction.getRawDescription());
            
            if (!"Uncategorized".equals(category)) {
                transaction.setCategory(category);
                transaction.setIsAiCategorized(true);
                successCount++;
            }
            // No need to sleep here as the job runs every minute, naturally spacing out requests
        }

        if (successCount > 0) {
            transactionRepository.saveAll(uncategorized);
            log.info("Successfully categorized and saved {} transactions.", successCount);
        } else {
            log.info("AI service did not return any valid categories in this run.");
        }
    }
}