package com.mentor.app.service;

import com.mentor.app.dao.GoalDao;
import com.mentor.app.dao.TaskDao;
import com.mentor.app.dao.TaskOccurrenceDao;
import com.mentor.app.domain.Goal;
import com.mentor.app.domain.OccurrenceStatus;
import com.mentor.app.domain.Task;
import com.mentor.app.domain.TaskOccurrence;
import com.mentor.app.dto.Dtos.GoalSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GoalStatsService {
    // tope de días que se recorren por tarea al contar las sesiones que quedan
    private static final int MAX_DAYS = 3660;

    private final GoalDao goals;
    private final TaskDao tasks;
    private final TaskOccurrenceDao occurrences;

    @Transactional(readOnly = true)
    public List<GoalSummary> summaries() {
        LocalDate today = LocalDate.now();
        Map<Long, List<Task>> byGoal = tasks.findAll().stream()
                .filter(t -> t.getGoalId() != null && t.isActive())
                .collect(Collectors.groupingBy(Task::getGoalId));
        return goals.findAll(Sort.by("id")).stream()
                .map(g -> summarize(g, byGoal.getOrDefault(g.getId(), List.of()), today))
                .toList();
    }

    @Transactional(readOnly = true)
    public GoalSummary summary(Long id) {
        Goal goal = goals.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Objetivo no encontrado"));
        List<Task> goalTasks = tasks.findAll().stream()
                .filter(t -> id.equals(t.getGoalId()) && t.isActive())
                .toList();
        return summarize(goal, goalTasks, LocalDate.now());
    }

    private GoalSummary summarize(Goal goal, List<Task> goalTasks, LocalDate today) {
        Set<Long> ids = goalTasks.stream().map(Task::getId).collect(Collectors.toSet());
        List<TaskOccurrence> all = ids.isEmpty() ? List.of() : occurrences.findByTaskIdIn(ids);

        int doneOrDueCount = 0;   // sesiones hasta hoy incluido
        double doneOrDue = 0;     // lo realizado en ellas
        int beforeCount = 0;      // sesiones anteriores a hoy
        double before = 0;
        for (TaskOccurrence o : all) {
            LocalDate day = o.getOccurrenceDate();
            if (o.getStatus() == OccurrenceStatus.SKIPPED || day.isAfter(today)) {
                continue;
            }
            double r = ratio(o);
            doneOrDueCount++;
            doneOrDue += r;
            if (day.isBefore(today)) {
                beforeCount++;
                before += r;
            }
        }

        int planned = doneOrDueCount + remainingSessions(goalTasks, all, goal.getTargetDate(), today);
        double progress = planned == 0 ? 0 : round3(doneOrDue / planned);
        Double adherence = beforeCount == 0 ? null : round3(before / beforeCount);
        Long daysLeft = goal.getTargetDate() == null
                ? null
                : ChronoUnit.DAYS.between(today, goal.getTargetDate());

        return new GoalSummary(
                goal.getId(), goal.getTitle(), goal.getDescription(), goal.getTargetDate(),
                goalTasks.size(), planned, (int) Math.round(doneOrDue), progress,
                adherence, daysLeft, pace(adherence));
    }

    // sesiones futuras: las ya generadas y, si hay fecha límite, las que saldrán según la repetición
    private int remainingSessions(List<Task> goalTasks, List<TaskOccurrence> all, LocalDate deadline, LocalDate today) {
        int total = 0;
        for (Task task : goalTasks) {
            List<TaskOccurrence> mine = all.stream()
                    .filter(o -> o.getTaskId().equals(task.getId()))
                    .toList();
            long generated = mine.stream()
                    .filter(o -> o.getOccurrenceDate().isAfter(today) && o.getStatus() != OccurrenceStatus.SKIPPED)
                    .count();

            Recurrence rule = parse(task);
            if (rule == null || deadline == null) {
                total += (int) generated;
                continue;
            }

            Set<LocalDate> skipped = mine.stream()
                    .filter(o -> o.getStatus() == OccurrenceStatus.SKIPPED)
                    .map(TaskOccurrence::getOccurrenceDate)
                    .collect(Collectors.toSet());

            LocalDate from = task.getStartDate().isAfter(today) ? task.getStartDate() : today.plusDays(1);
            LocalDate end = deadline;
            if (task.getEndDate() != null && task.getEndDate().isBefore(end)) {
                end = task.getEndDate();
            }
            LocalDate cap = from.plusDays(MAX_DAYS);
            if (end.isAfter(cap)) {
                end = cap;
            }
            for (LocalDate day = from; !day.isAfter(end); day = day.plusDays(1)) {
                if (rule.occursOn(day) && !skipped.contains(day)) {
                    total++;
                }
            }
        }
        return total;
    }

    private static Recurrence parse(Task task) {
        if (task.getRecurrenceRule() == null) {
            return null;
        }
        try {
            return Recurrence.parse(task.getRecurrenceRule(), task.getStartDate());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static String pace(Double adherence) {
        if (adherence == null) {
            return null;
        }
        if (adherence >= 0.8) {
            return "ON_TRACK";
        }
        if (adherence >= 0.5) {
            return "IRREGULAR";
        }
        return "BEHIND";
    }

    private static double ratio(TaskOccurrence o) {
        if (o.getTargetValue().signum() == 0) {
            return 0;
        }
        BigDecimal r = o.getCurrentValue().divide(o.getTargetValue(), 4, RoundingMode.HALF_UP);
        return Math.min(r.doubleValue(), 1.0);
    }

    private static double round3(double value) {
        return Math.round(value * 1000) / 1000.0;
    }
}