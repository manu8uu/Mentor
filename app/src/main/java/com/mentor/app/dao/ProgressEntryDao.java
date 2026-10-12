package com.mentor.app.dao;

import com.mentor.app.domain.ProgressEntry;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProgressEntryDao extends JpaRepository<ProgressEntry, Long> {
    void deleteByOccurrenceId(Long occurrenceId);

    @Query("select p from ProgressEntry p where p.occurrenceId in "
            + "(select o.id from TaskOccurrence o where o.taskId = :taskId) "
            + "order by p.createdAt desc, p.id desc")
    List<ProgressEntry> findByTask(@Param("taskId") Long taskId, Pageable pageable);
}