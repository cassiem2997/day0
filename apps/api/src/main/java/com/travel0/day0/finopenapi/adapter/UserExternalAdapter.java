package com.travel0.day0.finopenapi.adapter;

import com.travel0.day0.users.port.UserKeyExternalPort;
import com.travel0.day0.finopenapi.client.UserOpenApiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserExternalAdapter implements UserKeyExternalPort {

    private final UserOpenApiClient client;

    @Override
    public UserRegistrationResult registerMember(String apiKey, String userId) {
        var res = client.createMember(apiKey, userId);
        if (res == null || res.userKey() == null || res.userKey().isBlank()) {
            throw new IllegalStateException("FINOPENAPI_MEMBER_CREATE_FAILED");
        }
        return new UserRegistrationResult(
                res.userId(), res.userName(), res.institutionCode(), res.userKey(), res.created(), res.modified()
        );
    }

    @Override
    public UserRegistrationResult searchMember(String apiKey, String userId) {
        var res = client.searchMember(apiKey, userId);
        if (res == null || res.userKey() == null || res.userKey().isBlank()) {
            throw new IllegalStateException("FINOPENAPI_MEMBER_SEARCH_FAILED");
        }
        return new UserRegistrationResult(
                res.userId(), res.userName(), res.institutionCode(), res.userKey(), res.created(), res.modified()
        );
    }
}

