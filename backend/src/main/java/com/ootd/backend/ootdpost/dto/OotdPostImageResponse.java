package com.ootd.backend.ootdpost.dto;

import java.util.List;

public record OotdPostImageResponse(
        Long imageId,
        String imageUrl,
        Integer imageOrder,
        List<OotdBrandTagResponse> brandTags
) {
}
