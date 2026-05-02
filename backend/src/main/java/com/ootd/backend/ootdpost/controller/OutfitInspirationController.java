package com.ootd.backend.ootdpost.controller;

import com.ootd.backend.common.api.ApiResponse;
import com.ootd.backend.ootdpost.dto.OotdPostSummaryResponse;
import com.ootd.backend.ootdpost.entity.LookCategory;
import com.ootd.backend.ootdpost.service.OotdPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/outfit-inspirations")
@RequiredArgsConstructor
public class OutfitInspirationController {

    private final OotdPostService ootdPostService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OotdPostSummaryResponse>>> getInspirations(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) LookCategory lookCategory
    ) {
        return ResponseEntity.ok(ApiResponse.ok(ootdPostService.getInspirations(pageable, lookCategory)));
    }
}
