package com.ootd.backend.ootdpost.exception;

public class OotdPostNotFoundException extends RuntimeException {
    public OotdPostNotFoundException(Long id) {
        super("OOTD post not found: " + id);
    }
}
