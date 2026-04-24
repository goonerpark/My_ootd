package com.ootd.backend.ootdreview.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class CreateOotdReviewRequest {

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate reviewDate;

    @Size(max = 255, message = "notes must be at most 255 characters")
    private String notes;

    @NotEmpty(message = "at least one image is required")
    private List<MultipartFile> images;
}
