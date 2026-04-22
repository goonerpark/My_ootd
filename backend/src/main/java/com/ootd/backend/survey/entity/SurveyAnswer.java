package com.ootd.backend.survey.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "survey_answers")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SurveyAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "survey_date", nullable = false)
    private LocalDate surveyDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "outing_purpose", nullable = false, length = 20)
    private OutingPurpose outingPurpose;

    @Column(name = "notes", length = 255)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @Builder
    public SurveyAnswer(Long userId, LocalDate surveyDate, OutingPurpose outingPurpose, String notes) {
        this.userId = userId;
        this.surveyDate = surveyDate;
        this.outingPurpose = outingPurpose;
        this.notes = notes;
    }

    public void updateAnswer(OutingPurpose outingPurpose, String notes) {
        this.outingPurpose = outingPurpose;
        this.notes = notes;
    }
}
