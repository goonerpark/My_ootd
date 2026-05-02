package com.ootd.backend.ootdpost.exception;

public class OotdCommentNotFoundException extends RuntimeException {
    public OotdCommentNotFoundException(Long id) {
        super("OOTD comment not found: " + id);
    }
}
