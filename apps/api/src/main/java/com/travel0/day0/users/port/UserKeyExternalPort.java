package com.travel0.day0.users.port;

public interface UserKeyExternalPort {
    UserRegistrationResult registerMember(String apiKey, String userId);
    UserRegistrationResult searchMember(String apiKey, String userId);

    record UserRegistrationResult(
            String userId,
            String userName,
            String institutionCode,
            String userKey,
            String created,
            String modified
    ) {}
}
