package org.example.repository;

import org.example.entity.BudgetGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BudgetGoalRepository extends JpaRepository<BudgetGoal, UUID> {
    List<BudgetGoal> findByUserId(UUID userId);
    Optional<BudgetGoal> findByUserIdAndCategoryAndMonthYear(UUID userId, String category, String monthYear);
}
