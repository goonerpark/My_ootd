package com.ootd.backend.ootdpost.dto;

public record BrandTagInput(
        Integer imageIndex,
        String brandName,
        String shopUrl,
        Double positionX,
        Double positionY
) {
}
