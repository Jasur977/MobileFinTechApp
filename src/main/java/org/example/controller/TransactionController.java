package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.example.entity.Transaction;
import org.example.service.TransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<List<Transaction>> getTransactions(Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(transactionService.getTransactionsByUser(userEmail));
    }

    @GetMapping("/balance")
    public ResponseEntity<Map<String, BigDecimal>> getBalance(Authentication authentication) {
        String userEmail = authentication.getName();
        BigDecimal balance = transactionService.getBalanceByUser(userEmail);
        return ResponseEntity.ok(Map.of("balance", balance));
    }

    @PostMapping
    public ResponseEntity<Transaction> addTransaction(
            @RequestBody Transaction transaction, 
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(transactionService.addTransaction(userEmail, transaction));
    }

    @PostMapping("/upload")
    public ResponseEntity<List<Transaction>> uploadTransactions(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        List<Transaction> uploaded = transactionService.uploadCSV(userEmail, file);
        return ResponseEntity.ok(uploaded);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        transactionService.deleteTransaction(userEmail, id);
        return ResponseEntity.noContent().build();
    }
}