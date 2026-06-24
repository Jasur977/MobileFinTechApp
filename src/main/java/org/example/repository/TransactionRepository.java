package org.example.repository;

import org.example.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findByUserId(UUID userId);
    List<Transaction> findByUserIdAndIsAiCategorizedFalse(UUID userId);

    @Query("SELECT COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE -t.amount END), 0) FROM Transaction t WHERE t.user.id = :userId")
    BigDecimal calculateBalanceByUserId(@Param("userId") UUID userId);
}