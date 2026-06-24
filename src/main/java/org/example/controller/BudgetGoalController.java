package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.example.entity.BudgetGoal;
import org.example.service.BudgetGoalService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetGoalController {

    private final BudgetGoalService budgetGoalService;

    @GetMapping
    public ResponseEntity<List<BudgetGoal>> getBudgets(Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(budgetGoalService.getUserBudgetGoals(userEmail));
    }

    @PostMapping
    public ResponseEntity<BudgetGoal> setBudget(
            @RequestBody BudgetGoal goalRequest,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(budgetGoalService.setOrUpdateBudgetGoal(userEmail, goalRequest));
    }

    @GetMapping("/insights")
    public ResponseEntity<Map<String, Object>> getBudgetInsights(
            @RequestParam String monthYear,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(budgetGoalService.getBudgetInsights(userEmail, monthYear));
    }
}
