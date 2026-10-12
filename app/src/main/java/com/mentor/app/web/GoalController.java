package com.mentor.app.web;

import com.mentor.app.dao.GoalDao;
import com.mentor.app.domain.Goal;
import com.mentor.app.dto.Dtos.GoalRequest;
import com.mentor.app.dto.Dtos.GoalResponse;
import com.mentor.app.dto.Dtos.GoalSummary;
import com.mentor.app.service.GoalStatsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {
    private final GoalDao goals;
    private final GoalStatsService stats;

    // objetivos con su avance
    @GetMapping
    public List<GoalSummary> list() {
        return stats.summaries();
    }

    @GetMapping("/{id}")
    public GoalSummary get(@PathVariable Long id) {
        return stats.summary(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GoalResponse create(@Valid @RequestBody GoalRequest r) {
        Goal g = new Goal();
        fill(g, r);
        return GoalResponse.from(goals.save(g));
    }

    @PutMapping("/{id}")
    @Transactional
    public GoalResponse update(@PathVariable Long id, @Valid @RequestBody GoalRequest r) {
        Goal g = goals.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Objetivo no encontrado"));
        fill(g, r);
        return GoalResponse.from(g);
    }

    // las tareas del objetivo no se borran: quedan sin objetivo
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!goals.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Objetivo no encontrado");
        }
        goals.deleteById(id);
    }

    private void fill(Goal g, GoalRequest r) {
        g.setTitle(r.title().trim());
        g.setDescription(r.description());
        g.setTargetDate(r.targetDate());
    }
}