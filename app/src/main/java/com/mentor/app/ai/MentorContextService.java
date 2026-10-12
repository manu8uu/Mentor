package com.mentor.app.ai;

import com.mentor.app.dao.GoalDao;
import com.mentor.app.dao.ProgressEntryDao;
import com.mentor.app.dao.TaskOccurrenceDao;
import com.mentor.app.domain.Goal;
import com.mentor.app.domain.OccurrenceStatus;
import com.mentor.app.domain.ProgressEntry;
import com.mentor.app.domain.Task;
import com.mentor.app.domain.TaskOccurrence;
import com.mentor.app.dto.Dtos.GoalSummary;
import com.mentor.app.dto.Dtos.StatsResponse;
import com.mentor.app.service.GoalStatsService;
import com.mentor.app.service.StatsService;
import com.mentor.app.service.TaskService;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class MentorContextService {

    private final TaskService taskService;
    private final GoalDao goalDao;
    private final GoalStatsService goalStatsService;
    private final StatsService statsService;
    private final TaskOccurrenceDao occurrenceDao;
    private final ProgressEntryDao progressDao;

    public MentorContextService(
            TaskService taskService,
            GoalDao goalDao,
            GoalStatsService goalStatsService,
            StatsService statsService,
            TaskOccurrenceDao occurrenceDao,
            ProgressEntryDao progressDao) {
        this.taskService = taskService;
        this.goalDao = goalDao;
        this.goalStatsService = goalStatsService;
        this.statsService = statsService;
        this.occurrenceDao = occurrenceDao;
        this.progressDao = progressDao;
    }

    @Transactional(readOnly = true)
    public String buildContext() {
        LocalDate today = LocalDate.now();
        StringBuilder out = new StringBuilder();

        out.append("FECHA ACTUAL: ").append(today).append("\n");

        // OBJETIVOS Y PROGRESO
        List<Goal> goals = goalDao.findAll(Sort.by("id"));
        Map<Long, GoalSummary> summaries =
                goalStatsService.summaries().stream()
                        .collect(Collectors.toMap(
                                GoalSummary::id, summary -> summary));

        out.append("\nOBJETIVOS:\n");

        if (goals.isEmpty()) {
            out.append("No hay objetivos registrados.\n");
        }

        for (Goal goal : goals.stream().limit(30).toList()) {
            GoalSummary summary = summaries.get(goal.getId());

            out.append("- ").append(goal.getTitle())
                    .append(" (ID ").append(goal.getId()).append(")");

            if (goal.getDescription() != null) {
                out.append("; descripción: ").append(goal.getDescription());
            }

            out.append("; fecha límite: ")
                    .append(goal.getTargetDate() != null
                            ? goal.getTargetDate() : "sin fecha");

            if (summary != null) {
                out.append("; tareas activas: ").append(summary.taskCount())
                        .append("; progreso estimado: ")
                        .append(Math.round(summary.progress() * 100))
                        .append("%; sesiones completadas o realizadas: ")
                        .append(summary.completed());

                if (summary.adherence() != null) {
                    out.append("; cumplimiento histórico: ")
                            .append(Math.round(summary.adherence() * 100))
                            .append("%");
                }

                if (summary.pace() != null) {
                    out.append("; ritmo: ").append(summary.pace());
                }
            }

            out.append("\n");
        }

        // TAREAS
        List<Task> allTasks = taskService.list();

        Map<Long, Task> taskById = allTasks.stream()
                .collect(Collectors.toMap(Task::getId, task -> task));

        List<Task> activeTasks = allTasks.stream()
                .filter(Task::isActive)
                .sorted(Comparator.comparing(Task::getId).reversed())
                .limit(40)
                .toList();

        out.append("\nTAREAS ACTIVAS (máximo 40):\n");

        if (activeTasks.isEmpty()) {
            out.append("No hay tareas activas.\n");
        }

        for (Task task : activeTasks) {
            out.append("- ").append(task.getTitle())
                    .append(" (ID ").append(task.getId()).append(")")
                    .append("; objetivo asociado: ")
                    .append(task.getGoalId() != null
                            ? task.getGoalId() : "ninguno")
                    .append("; meta por sesión: ")
                    .append(task.getTargetValue()).append(" ")
                    .append(task.getUnit())
                    .append("; recurrencia: ")
                    .append(task.getRecurrenceRule() != null
                            ? task.getRecurrenceRule() : "ocasional")
                    .append("; inicio: ").append(task.getStartDate())
                    .append("; fin: ")
                    .append(task.getEndDate() != null
                            ? task.getEndDate() : "sin fecha final")
                    .append("\n");
        }

        out.append("Total de tareas activas: ")
                .append(allTasks.stream().filter(Task::isActive).count())
                .append("; inactivas: ")
                .append(allTasks.stream().filter(t -> !t.isActive()).count())
                .append("\n");

        // SESIONES RECIENTES Y PRÓXIMAS
        List<TaskOccurrence> occurrences =
                occurrenceDao
                        .findByOccurrenceDateBetweenOrderByOccurrenceDateAscIdAsc(
                                today.minusDays(7), today.plusDays(14))
                        .stream()
                        .filter(o -> o.getStatus() != OccurrenceStatus.SKIPPED)
                        .toList();

        out.append("\nSESIONES DE LOS ÚLTIMOS 7 DÍAS Y LOS PRÓXIMOS 14:\n");

        for (TaskOccurrence occurrence : occurrences.stream().limit(60).toList()) {
            Task task = taskById.get(occurrence.getTaskId());

            out.append("- Fecha: ").append(occurrence.getOccurrenceDate())
                    .append("; tarea: ")
                    .append(task != null ? task.getTitle() : "desconocida")
                    .append("; estado: ").append(occurrence.getStatus())
                    .append("; progreso: ").append(occurrence.getCurrentValue())
                    .append("/").append(occurrence.getTargetValue())
                    .append("\n");
        }

        // ESTADÍSTICAS
        StatsResponse stats = statsService.compute(4);

        out.append("\nESTADÍSTICAS:\n")
                .append("- Racha actual: ").append(stats.currentStreak())
                .append(" días\n")
                .append("- Mejor racha: ").append(stats.bestStreak())
                .append(" días\n")
                .append("- Sesiones completadas esta semana: ")
                .append(stats.weekDone()).append("/")
                .append(stats.weekTotal()).append("\n")
                .append("- Sesiones completadas en el periodo registrado: ")
                .append(stats.totalCompleted()).append("\n");

        // HISTORIAL RECIENTE DE PROGRESO
        List<ProgressEntry> entries = progressDao.findAll(
                PageRequest.of(
                        0,
                        20,
                        Sort.by(
                                Sort.Order.desc("createdAt"),
                                Sort.Order.desc("id")
                        )
                )
        ).getContent();

        Set<Long> occurrenceIds = entries.stream()
                .map(ProgressEntry::getOccurrenceId)
                .collect(Collectors.toSet());

        Map<Long, TaskOccurrence> occurrenceById =
                occurrenceDao.findAllById(occurrenceIds).stream()
                        .collect(Collectors.toMap(
                                TaskOccurrence::getId, occurrence -> occurrence));

        out.append("\nÚLTIMAS 20 ENTRADAS DEL HISTORIAL:\n");

        if (entries.isEmpty()) {
            out.append("Todavía no hay entradas de progreso.\n");
        }

        for (ProgressEntry entry : entries) {
            TaskOccurrence occurrence =
                    occurrenceById.get(entry.getOccurrenceId());

            Task task = occurrence != null
                    ? taskById.get(occurrence.getTaskId()) : null;

            out.append("- Fecha de registro: ").append(entry.getCreatedAt())
                    .append("; tarea: ")
                    .append(task != null ? task.getTitle() : "desconocida")
                    .append("; fecha de sesión: ")
                    .append(occurrence != null
                            ? occurrence.getOccurrenceDate() : "desconocida")
                    .append("; cantidad registrada: ").append(entry.getAmount());

            if (entry.getNote() != null && !entry.getNote().isBlank()) {
                String note = entry.getNote().replaceAll("\\s+", " ");
                if (note.length() > 200) {
                    note = note.substring(0, 200) + "...";
                }
                out.append("; nota: ").append(note);
            }

            out.append("\n");
        }

        return out.toString();
    }
}