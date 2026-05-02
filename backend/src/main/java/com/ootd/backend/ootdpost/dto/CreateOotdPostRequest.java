package com.ootd.backend.ootdpost.dto;

import com.ootd.backend.ootdpost.entity.LookCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

public class CreateOotdPostRequest {

    @NotNull(message = "images are required")
    private List<MultipartFile> images = new ArrayList<>();

    @NotBlank(message = "caption is required")
    private String caption;

    @NotNull(message = "lookCategory is required")
    private LookCategory lookCategory;

    private List<String> hashtags = new ArrayList<>();

    private String brandTagsJson;

    public List<MultipartFile> getImages() {
        return images;
    }

    public void setImages(List<MultipartFile> images) {
        this.images = images;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }

    public LookCategory getLookCategory() {
        return lookCategory;
    }

    public void setLookCategory(LookCategory lookCategory) {
        this.lookCategory = lookCategory;
    }

    public List<String> getHashtags() {
        return hashtags;
    }

    public void setHashtags(List<String> hashtags) {
        this.hashtags = hashtags;
    }

    public String getBrandTagsJson() {
        return brandTagsJson;
    }

    public void setBrandTagsJson(String brandTagsJson) {
        this.brandTagsJson = brandTagsJson;
    }
}
