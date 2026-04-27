package com.ootd.backend.ootdreview.dto;

import java.util.List;

public record OotdClosetSuggestionsResponse(
        List<OotdClosetSuggestionItemResponse> suggestions,
        String message
) {
}
