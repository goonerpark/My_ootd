package com.ootd.backend.closet.exception;

public class ClosetItemAccessDeniedException extends RuntimeException {
    public ClosetItemAccessDeniedException(String message) {
        super(message);
    }
}
