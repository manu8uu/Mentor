package com.mentor.app.service;

import com.mentor.app.dao.ProgressEntryDao;
import com.mentor.app.dao.TaskDao;
import com.mentor.app.dao.TaskOccurrenceDao;
import com.mentor.app.domain.ProgressEntry;
import com.mentor.app.domain.TaskOccurrence;
import com.mentor.app.dto.Dtos.HistoryEntry;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HistoryService {
    private final TaskDao tasks;
    private final TaskOccurrenceDao occurrences;
    private final ProgressEntryDao progress;

    @Transactional(readOnly = true)
    public List<HistoryEntry> forTask(Long taskId, int limit) {
        if (!tasks.existsById(taskId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarea no encontrada");
        }
        List<ProgressEntry> entries = progress.findByTask(taskId, PageRequest.of(0, limit));

        Set<Long> occurrenceIds = entries.stream()
                .map(ProgressEntry::getOccurrenceId)
                .collect(Collectors.toSet());
        Map<Long, LocalDate> dates = occurrences.findAllById(occurrenceIds).stream()
                .collect(Collectors.toMap(TaskOccurrence::getId, TaskOccurrence::getOccurrenceDate));

        return entries.stream()
                .map(e -> new HistoryEntry(
                        e.getId(), dates.get(e.getOccurrenceId()), e.getAmount(), e.getNote(), e.getCreatedAt()))
                .toList();
    }
}