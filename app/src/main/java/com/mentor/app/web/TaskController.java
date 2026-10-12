package com.mentor.app.web;

import com.mentor.app.dto.Dtos.HistoryEntry;
import com.mentor.app.dto.Dtos.ReminderRequest;
import com.mentor.app.dto.Dtos.TaskRequest;
import com.mentor.app.dto.Dtos.TaskResponse;
import com.mentor.app.service.HistoryService;
import com.mentor.app.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.mentor.app.dto.Dtos.GoalLinkRequest;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {
    private final TaskService service;
    private final HistoryService historyService;

    @GetMapping
    public List<TaskResponse> list() {
        return service.list().stream().map(TaskResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse create(@Valid @RequestBody TaskRequest r) {
        return TaskResponse.from(service.create(r));
    }

    @PutMapping("/{id}")
    public TaskResponse update(@PathVariable Long id, @Valid @RequestBody TaskRequest r) {
        return TaskResponse.from(service.update(id, r));
    }

    // scope=all (por defecto) borra todo; scope=future elimina desde hoy y conserva el pasado
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @RequestParam(defaultValue = "all") String scope) {
        service.delete(id, scope);
    }

    @GetMapping("/{id}/history")
    public List<HistoryEntry> history(@PathVariable Long id, @RequestParam(defaultValue = "50") int limit) {
        return historyService.forTask(id, Math.min(Math.max(limit, 1), 200));
    }

    @PutMapping("/{id}/reminder")
    public TaskResponse reminder(@PathVariable Long id, @RequestBody ReminderRequest r) {
        return TaskResponse.from(service.setReminder(id, r.time()));
    }

    @PutMapping("/{id}/goal")
    public TaskResponse goal(@PathVariable Long id, @RequestBody GoalLinkRequest r) {
        return TaskResponse.from(service.setGoal(id, r.goalId()));
    }
}