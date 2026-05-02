package com.ootd.backend.ootdpost.dto;

public record OotdBrandTagResponse(
        Long brandTagId,
        String brandName,
        String shopUrl,
        Double positionX,
        Double positionY
) {
}
