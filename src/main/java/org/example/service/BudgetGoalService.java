package org.example.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.entity.AppUser;
import org.example.entity.BudgetGoal;
import org.example.entity.Transaction;
import org.example.entity.TransactionType;
import org.example.repository.AppUserRepository;
import org.example.repository.BudgetGoalRepository;
import org.example.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetGoalService {

    private final BudgetGoalRepository budgetGoalRepository;
    private final TransactionRepository transactionRepository;
    private final AppUserRepository appUserRepository;

    public List<BudgetGoal> getUserBudgetGoals(String userEmail) {
        AppUser user = appUserRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return budgetGoalRepository.findByUserId(user.getId());
    }

    @Transactional
    public BudgetGoal setOrUpdateBudgetGoal(String userEmail, BudgetGoal goalRequest) {
        AppUser user = appUserRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<BudgetGoal> existingGoal = budgetGoalRepository.findByUserIdAndCategoryAndMonthYear(
                user.getId(), goalRequest.getCategory(), goalRequest.getMonthYear()
        );

        if (existingGoal.isPresent()) {
            BudgetGoal goal = existingGoal.get();
            goal.setTargetAmount(goalRequest.getTargetAmount());
            return budgetGoalRepository.save(goal);
        } else {
            goalRequest.setUser(user);
            return budgetGoalRepository.save(goalRequest);
        }
    }

    public Map<String, Object> getBudgetInsights(String userEmail, String monthYear) {
        AppUser user = appUserRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<BudgetGoal> goals = budgetGoalRepository.findByUserId(user.getId());
        List<Transaction> allTransactions = transactionRepository.findByUserId(user.getId());

        // Filter transactions for the requested monthYear (MM-yyyy format)
        SimpleDateFormat sdf = new SimpleDateFormat("MM-yyyy");
        List<Transaction> monthlyTransactions = allTransactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .filter(t -> sdf.format(t.getTransactionDate()).equals(monthYear))
                .toList();

        // Calculate total spent per category
        Map<String, BigDecimal> spentByCategory = new HashMap<>();
        for (Transaction t : monthlyTransactions) {
            String category = t.getCategory() != null ? t.getCategory() : "Uncategorized";
            spentByCategory.put(category, spentByCategory.getOrDefault(category, BigDecimal.ZERO).add(t.getAmount()));
        }

        // Build insights
        List<Map<String, Object>> insights = goals.stream()
                .filter(goal -> goal.getMonthYear().equals(monthYear))
                .map(goal -> {
                    BigDecimal spent = spentByCategory.getOrDefault(goal.getCategory(), BigDecimal.ZERO);
                    BigDecimal target = goal.getTargetAmount();
                    BigDecimal remaining = target.subtract(spent);
                    
                    // Warning threshold: spent more than 80% of budget
                    boolean warning = spent.compareTo(target.multiply(new BigDecimal("0.8"))) > 0;

                    Map<String, Object> insight = new HashMap<>();
                    insight.put("category", goal.getCategory());
                    insight.put("target", target);
                    insight.put("spent", spent);
                    insight.put("remaining", remaining);
                    insight.put("isNearLimit", warning);
                    insight.put("isExceeded", spent.compareTo(target) > 0);
                    return insight;
                })
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("monthYear", monthYear);
        result.put("insights", insights);

        return result;
    }
}
