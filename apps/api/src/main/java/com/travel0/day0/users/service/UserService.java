package com.travel0.day0.users.service;

import com.travel0.day0.users.domain.University;
import com.travel0.day0.users.domain.User;
import com.travel0.day0.users.dto.ProfileResponse;
import com.travel0.day0.users.dto.ProfileUpdateRequest;
import com.travel0.day0.users.repository.UniversityRepository;
import com.travel0.day0.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepo;
    private final UniversityRepository universityRepo;
    private final FileService fileService;

    public User createUser(String email, String password, String nickname) {
        User user = new User();
        user.setEmail(email);
        user.setPassword(password);
        user.setNickname(nickname);
        return userRepo.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepo.findByEmail(email);
    }

    @Transactional
    public void updateUserKey(Long userId, String userKey){
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        user.setUserKey(userKey);
        userRepo.save(user);
    }

    public ProfileResponse getProfile(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        String countryName = null;
        if (user.getCurrentDepartureInfo() != null && user.getCurrentDepartureInfo().getCountryCode() != null) {
            String countryCode = user.getCurrentDepartureInfo().getCountryCode();
            countryName = new Locale("", countryCode).getDisplayCountry(Locale.KOREAN);
        }

        return ProfileResponse.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .gender(user.getGender())
                .birth(user.getBirth())
                .profileImage(user.getProfileImage())
                .mileage(user.getMileage())
                .country(countryName)
                .homeUniv(user.getHomeUniversity() != null ? user.getHomeUniversity().getName() : null)
                .destUniv(user.getDestUniversity() != null ? user.getDestUniversity().getName() : null)
                .departureDate(user.getCurrentDepartureInfo() != null ? user.getCurrentDepartureInfo().getStartDate() : null)
                .build();
    }

    public ProfileResponse updateProfile(Long userId, ProfileUpdateRequest request, MultipartFile profileImage) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        if(request.getName() != null){
            user.setName(request.getName());
        }
        if(request.getNickname() != null){
            user.setNickname(request.getNickname());
        }
        if(request.getGender() != null){
            user.setGender(request.getGender());
        }
        if(request.getBirth() != null){
            user.setBirth(request.getBirth());
        }
        if(profileImage != null && !profileImage.isEmpty()){
            if(user.getProfileImage() != null){
                fileService.deleteProfileImage(user.getProfileImage());
            }
            String imageUrl = fileService.saveProfileImage(profileImage);
            user.setProfileImage(imageUrl);
        }
        if(request.getDeleteProfileImage() != null && request.getDeleteProfileImage()) {
            if(user.getProfileImage() != null) {
                fileService.deleteProfileImage(user.getProfileImage());
                user.setProfileImage(null);
            }
        }
        if(request.getHomeUnivId() != null){
            University univ = universityRepo.findById(request.getHomeUnivId())
                            .orElseThrow(() -> new RuntimeException("대학을 찾을 수 없습니다."));
            user.setHomeUniversity(univ);
        }

        String countryName = null;
        if (user.getCurrentDepartureInfo() != null && user.getCurrentDepartureInfo().getCountryCode() != null) {
            String countryCode = user.getCurrentDepartureInfo().getCountryCode();
            countryName = new Locale("", countryCode).getDisplayCountry(Locale.KOREAN);
        }

        userRepo.save(user);
        return ProfileResponse.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .gender(user.getGender())
                .birth(user.getBirth())
                .profileImage(user.getProfileImage())
                .mileage(user.getMileage())
                .country(countryName)
                .homeUniv(user.getHomeUniversity() != null ? user.getHomeUniversity().getName() : null)
                .destUniv(user.getDestUniversity() != null ? user.getDestUniversity().getName() : null)
                .departureDate(user.getCurrentDepartureInfo() != null ? user.getCurrentDepartureInfo().getStartDate() : null)
                .build();
    }
}
