package com.travel0.day0.users.repository;

import com.travel0.day0.users.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

}
