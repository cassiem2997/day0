package com.travel0.day0.account.repository;

import com.travel0.day0.account.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByBankCodeAndAccountTypeUniqueNo(String bankCode, String accountTypeUniqueNo);

    boolean existsByBankCodeAndAccountTypeUniqueNo(String bankCode, String accountTypeUniqueNo);
}