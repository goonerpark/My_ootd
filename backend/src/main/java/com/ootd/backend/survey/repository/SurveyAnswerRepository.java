package com.ootd.backend.survey.repository;

import com.ootd.backend.survey.entity.SurveyAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface SurveyAnswerRepository extends JpaRepository<SurveyAnswer, Long> {
    Optional<SurveyAnswer> findByUserIdAndSurveyDate(Long userId, LocalDate surveyDate);
}
