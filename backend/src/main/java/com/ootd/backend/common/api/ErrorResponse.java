package com.ootd.backend.common.api;

public record ErrorResponse(
        String code,
        String message
) {
}
