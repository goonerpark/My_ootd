package com.ootd.backend.closet.exception;

public class ClosetItemNotFoundException extends RuntimeException {
    public ClosetItemNotFoundException(String message) {
        super(message);
    }
}
