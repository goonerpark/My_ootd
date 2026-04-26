package com.ootd.backend.closet.dto;

import com.ootd.backend.closet.entity.ClosetCategory;
import com.ootd.backend.closet.entity.ClosetFit;
import com.ootd.backend.closet.entity.ClosetSeason;
import com.ootd.backend.closet.entity.ClosetThickness;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class UpdateClosetItemRequest {

    private ClosetCategory category;

    @Size(max = 50, message = "subcategory must be at most 50 characters")
    private String subcategory;

    @Size(max = 50, message = "color must be at most 50 characters")
    private String color;

    private ClosetSeason season;

    private ClosetThickness thickness;

    private ClosetFit fit;

    @Size(max = 100, message = "brand must be at most 100 characters")
    private String brand;

    @Size(max = 500, message = "imageUrl must be at most 500 characters")
    private String imageUrl;

    @Size(max = 255, message = "memo must be at most 255 characters")
    private String memo;

    private MultipartFile imageFile;
}
