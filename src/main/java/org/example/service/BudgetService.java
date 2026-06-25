package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.entity.AppUser;
import org.example.entity.Budget;
import org.example.repository.AppUserRepository;
import org.example.repository.BudgetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final AppUserRepository appUserRepository;

    public List<Budget> getBudgetsByUser(String userEmail) {
        AppUser user = appUserRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return budgetRepository.findByUserId(user.getId());
    }

    @Transactional
    public Budget createBudget(String userEmail, Budget budget) {
        AppUser user = appUserRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        budget.setUser(user);
        // Basic validation can be added here, e.g., check if a budget for that category already exists
        
        return budgetRepository.save(budget);
    }
}