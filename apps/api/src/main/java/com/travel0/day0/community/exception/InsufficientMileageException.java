package com.travel0.day0.community.exception;

public class InsufficientMileageException extends CommunityException {
    public InsufficientMileageException(long required, long current) {
        super(String.format("마일리지가 부족합니다. 필요: %d, 보유: %d", required, current));
    }
}