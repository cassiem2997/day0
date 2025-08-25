package com.travel0.day0.community.exception;

public class PostNotFoundException extends CommunityException {
    public PostNotFoundException(Long postId) {
        super("게시글을 찾을 수 없습니다: " + postId);
    }
}