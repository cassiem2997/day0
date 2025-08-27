package com.travel0.day0.users.service;

import com.travel0.day0.users.port.UserKeyExternalPort;
import com.travel0.day0.users.repository.UserRepository;
import com.travel0.day0.users.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserKeyService {

    private final UserRepository userRepository;
    private final UserKeyExternalPort external;

    @Transactional
    public String saveUserKey(Long userId, String apiKey) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));

        var result = external.registerMember(apiKey, user.getEmail());
        user.setUserKey(result.userKey());
        userRepository.save(user);

        return result.userKey();
    }

    @Transactional
    public String searchUserKey(Long userId, String apiKey) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
        var result = external.searchMember(apiKey, user.getEmail());
        return result.userKey();
    }
}
