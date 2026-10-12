package com.mentor.app.dto;

import com.mentor.app.domain.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public final class Dtos {
    private Dtos() { }

    // ----- Goals -----
    public record GoalRequest(
            @NotBlank @Size(max = 200) String title,
            String description,
            LocalDate targetDate) { }

    public record GoalResponse(Long id, String title, String description, LocalDate targetDate) {
        public static GoalResponse from(Goal g) {
            return new GoalResponse(g.getId(), g.getTitle(), g.getDescription(), g.getTargetDate());
        }
    }

    // ----- Tasks -----
    public record TaskRequest(
            Long goalId,
            @NotBlank @Size(max = 200) String title,
            @NotBlank @Size(max = 50) String unit,
            @NotNull @Positive BigDecimal targetValue,
            @Size(max = 255) String recurrenceRule,
            LocalDate startDate,
            LocalDate endDate,
            Boolean active,
            LocalTime reminderTime) { }

    public record TaskResponse(
            Long id, Long goalId, String title, String unit, BigDecimal targetValue,
            String recurrenceRule, LocalDate startDate, LocalDate endDate, boolean active,
            LocalTime reminderTime) {
        public static TaskResponse from(Task t) {
            return new TaskResponse(t.getId(), t.getGoalId(), t.getTitle(), t.getUnit(),
                    t.getTargetValue(), t.getRecurrenceRule(), t.getStartDate(), t.getEndDate(),
                    t.isActive(), t.getReminderTime());
        }
    }

    // time en null quita el recordatorio
    public record ReminderRequest(LocalTime time) { }

    // ----- Occurrences / progress -----
    public record OccurrenceResponse(
            Long id, Long taskId, String taskTitle, String unit, LocalDate date,
            BigDecimal targetValue, BigDecimal currentValue, double progress,
            OccurrenceStatus status, String recurrenceRule, LocalTime reminderTime) {
        public static OccurrenceResponse from(TaskOccurrence o, Task t) {
            double progress = o.getTargetValue().signum() == 0 ? 0
                    : o.getCurrentValue().divide(o.getTargetValue(), 4, RoundingMode.HALF_UP).doubleValue();
            return new OccurrenceResponse(o.getId(), o.getTaskId(), t.getTitle(), t.getUnit(),
                    o.getOccurrenceDate(), o.getTargetValue(), o.getCurrentValue(), progress,
                    o.getStatus(), t.getRecurrenceRule(), t.getReminderTime());
        }
    }

    // amount puede ser negativo para corregir un error
    public record ProgressRequest(@NotNull BigDecimal amount, @Size(max = 255) String note) { }

    // un registro del historial de una tarea
    public record HistoryEntry(Long id, LocalDate date, BigDecimal amount, String note, Instant createdAt) { }

    // ----- Estadísticas -----
    public record DayStats(LocalDate date, int total, int done, double progress) { }

    public record StatsResponse(
            int currentStreak, int bestStreak, int weekDone, int weekTotal, int totalCompleted,
            LocalDate from, List<DayStats> days) { }
    
    // goalId en null desvincula la tarea
    public record GoalLinkRequest(Long goalId) { }

    // objetivo con su avance; adherence, daysLeft y pace pueden ser null
    public record GoalSummary(
            Long id, String title, String description, LocalDate targetDate,
            int taskCount, int planned, int completed, double progress,
            Double adherence, Long daysLeft, String pace) { }
}