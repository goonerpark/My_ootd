package com.ootd.backend.ootdreview.ai.client;

import com.ootd.backend.ootdreview.ai.dto.OotdEvaluationResult;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface OotdEvaluationClient {
    OotdEvaluationResult evaluate(List<MultipartFile> imageFiles, String notes);
}
