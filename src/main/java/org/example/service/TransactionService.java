package org.example.service;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.entity.AppUser;
import org.example.entity.Transaction;
import org.example.entity.TransactionType;
import org.example.repository.AppUserRepository;
import org.example.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.Reader;
import java.math.BigDecimal;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AppUserRepository appUserRepository;

    public List<Transaction> getTransactionsByUser(String userEmail) {
        AppUser user = appUserRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return transactionRepository.findByUserId(user.getId());
    }

    public BigDecimal getBalanceByUser(String userEmail) {
        AppUser user = appUserRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return transactionRepository.calculateBalanceByUserId(user.getId());
    }

    public Transaction addTransaction(String userEmail, Transaction transaction) {
        AppUser user = appUserRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Set default values for manual entry
        transaction.setUser(user);
        transaction.setType(TransactionType.EXPENSE); // Default to EXPENSE
        transaction.setIsAiCategorized(false); // Not categorized by AI yet

        return transactionRepository.save(transaction);
    }

    @Transactional
    public List<Transaction> uploadCSV(String userEmail, MultipartFile file) {
        AppUser user = appUserRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        List<Transaction> savedTransactions = new ArrayList<>();

        try (Reader reader = new InputStreamReader(file.getInputStream());
             CSVReader csvReader = new CSVReader(reader)) {

            String[] line;
            // Skip header if it exists
            csvReader.readNext();

            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");

            while ((line = csvReader.readNext()) != null) {
                try {
                    // Assuming CSV format: Date, Description, Amount, Type
                    Date date = dateFormat.parse(line[0]);
                    String description = line[1];
                    BigDecimal amount = new BigDecimal(line[2]);
                    TransactionType type = TransactionType.valueOf(line[3].toUpperCase());

                    Transaction t = Transaction.builder()
                            .user(user)
                            .transactionDate(date)
                            .rawDescription(description)
                            .amount(amount)
                            .type(type)
                            .isAiCategorized(false) // Ready for the AI job
                            .build();

                    savedTransactions.add(t);

                } catch (ParseException | IllegalArgumentException e) {
                    log.error("Failed to parse CSV row: {}", String.join(",", line), e);
                    // Decide whether to fail the whole batch or skip the row
                }
            }

            if (!savedTransactions.isEmpty()) {
                transactionRepository.saveAll(savedTransactions);
            }

        } catch (Exception e) {
            log.error("Error processing CSV upload", e);
            throw new RuntimeException("Failed to process CSV file", e);
        }

        return savedTransactions;
    }

    @Transactional
    public void deleteTransaction(String userEmail, UUID transactionId) {
        AppUser user = appUserRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to delete this transaction");
        }

        transactionRepository.delete(transaction);
    }
}