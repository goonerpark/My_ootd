package com.ootd.backend.common.exception;

import com.ootd.backend.common.api.ApiResponse;
import com.ootd.backend.closet.exception.ClosetImageStorageException;
import com.ootd.backend.closet.exception.ClosetItemAccessDeniedException;
import com.ootd.backend.closet.exception.ClosetItemNotFoundException;
import com.ootd.backend.ootdreview.exception.OotdImageStorageException;
import com.ootd.backend.ootdreview.exception.OotdReviewAccessDeniedException;
import com.ootd.backend.ootdreview.exception.OotdReviewNotFoundException;
import com.ootd.backend.survey.exception.SurveyNotFoundException;
import com.ootd.backend.user.exception.AuthenticationFailedException;
import com.ootd.backend.user.exception.DuplicateEmailException;
import com.ootd.backend.user.exception.DuplicateNicknameException;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.validation.FieldError;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ApiResponse<Void>> handleDuplicateEmail(DuplicateEmailException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.fail("DUPLICATE_EMAIL", ex.getMessage()));
    }

    @ExceptionHandler(DuplicateNicknameException.class)
    public ResponseEntity<ApiResponse<Void>> handleDuplicateNickname(DuplicateNicknameException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.fail("DUPLICATE_NICKNAME", ex.getMessage()));
    }

    @ExceptionHandler(AuthenticationFailedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthenticationFailed(AuthenticationFailedException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.fail("AUTH_FAILED", ex.getMessage()));
    }

    @ExceptionHandler(SurveyNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleSurveyNotFound(SurveyNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.fail("SURVEY_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(OotdReviewNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleOotdReviewNotFound(OotdReviewNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.fail("OOTD_REVIEW_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(OotdReviewAccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleOotdReviewAccessDenied(OotdReviewAccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.fail("OOTD_REVIEW_FORBIDDEN", ex.getMessage()));
    }

    @ExceptionHandler(OotdImageStorageException.class)
    public ResponseEntity<ApiResponse<Void>> handleOotdImageStorage(OotdImageStorageException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail("OOTD_IMAGE_STORAGE_FAILED", "Image storage failed"));
    }

    @ExceptionHandler(ClosetItemNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleClosetItemNotFound(ClosetItemNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.fail("CLOSET_ITEM_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(ClosetItemAccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleClosetItemAccessDenied(ClosetItemAccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.fail("CLOSET_ITEM_FORBIDDEN", ex.getMessage()));
    }

    @ExceptionHandler(ClosetImageStorageException.class)
    public ResponseEntity<ApiResponse<Void>> handleClosetImageStorage(ClosetImageStorageException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail("CLOSET_IMAGE_STORAGE_FAILED", "Closet image storage failed"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.fail("VALIDATION_ERROR", ex.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.fail("DATA_INTEGRITY_VIOLATION", "Duplicate or invalid relational data"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> formatFieldError(fieldError))
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(ApiResponse.fail("VALIDATION_ERROR", message));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraint(ConstraintViolationException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.fail("VALIDATION_ERROR", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.fail("VALIDATION_ERROR", "Invalid request parameter: " + ex.getName()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
        log.error("Unhandled server exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail("INTERNAL_SERVER_ERROR", "Unexpected server error"));
    }

    private String formatFieldError(FieldError fieldError) {
        return fieldError.getField() + ": " + fieldError.getDefaultMessage();
    }
}
