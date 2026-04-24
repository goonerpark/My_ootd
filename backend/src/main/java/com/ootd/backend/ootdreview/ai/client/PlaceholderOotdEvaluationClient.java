package com.ootd.backend.ootdreview.ai.client;

import com.ootd.backend.ootdreview.ai.dto.OotdEvaluationResult;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@Component
public class PlaceholderOotdEvaluationClient implements OotdEvaluationClient {

    @Override
    public OotdEvaluationResult evaluate(List<MultipartFile> imageFiles, String notes) {
        return new OotdEvaluationResult(
                BigDecimal.valueOf(4.0),
                "\uC804\uCCB4\uC801\uC778 \uD54F\uC774 \uBB34\uB09C\uD569\uB2C8\uB2E4.",
                "\uC0C9 \uC870\uD569\uC774 \uC790\uC5F0\uC2A4\uB7FD\uC2B5\uB2C8\uB2E4.",
                "\uC804\uCCB4\uC801\uC73C\uB85C \uAE54\uB054\uD55C OOTD\uC785\uB2C8\uB2E4.",
                "placeholder-v1"
        );
    }
}
