package com.travel0.day0.community.exception;

public class CommunityException extends RuntimeException {
    public CommunityException(String message) {
        super(message);
    }

    public CommunityException(String message, Throwable cause) {
        super(message, cause);
    }
}