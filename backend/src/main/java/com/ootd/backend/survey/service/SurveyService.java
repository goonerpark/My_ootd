package com.ootd.backend.survey.service;

import com.ootd.backend.survey.dto.TodaySurveyResponse;
import com.ootd.backend.survey.dto.UpsertSurveyRequest;
import com.ootd.backend.survey.entity.SurveyAnswer;
import com.ootd.backend.survey.exception.SurveyNotFoundException;
import com.ootd.backend.survey.repository.SurveyAnswerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class SurveyService {

    private final SurveyAnswerRepository surveyAnswerRepository;

    @Transactional
    public TodaySurveyResponse upsertTodaySurvey(Long userId, UpsertSurveyRequest request) {
        LocalDate today = LocalDate.now();
        SurveyAnswer answer = surveyAnswerRepository.findByUserIdAndSurveyDate(userId, today)
                .map(existing -> {
                    existing.updateAnswer(request.outingPurpose(), request.notes());
                    return existing;
                })
                .orElseGet(() -> SurveyAnswer.builder()
                        .userId(userId)
                        .surveyDate(today)
                        .outingPurpose(request.outingPurpose())
                        .notes(request.notes())
                        .build());

        SurveyAnswer saved = surveyAnswerRepository.save(Objects.requireNonNull(answer));
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public TodaySurveyResponse getTodaySurvey(Long userId) {
        LocalDate today = LocalDate.now();
        SurveyAnswer answer = surveyAnswerRepository.findByUserIdAndSurveyDate(userId, today)
                .orElseThrow(() -> new SurveyNotFoundException("Today's survey was not found"));
        return toResponse(answer);
    }

    @Transactional(readOnly = true)
    public SurveyAnswer findTodaySurveyOrNull(Long userId) {
        return surveyAnswerRepository.findByUserIdAndSurveyDate(userId, LocalDate.now()).orElse(null);
    }

    private TodaySurveyResponse toResponse(SurveyAnswer answer) {
        return new TodaySurveyResponse(
                answer.getId(),
                answer.getUserId(),
                answer.getSurveyDate(),
                answer.getOutingPurpose(),
                answer.getNotes(),
                answer.getCreatedAt()
        );
    }
}
