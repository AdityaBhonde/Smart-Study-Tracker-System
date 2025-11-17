package com.aditya.Study.Tracker.web;

import com.aditya.Study.Tracker.data.models.StudyLog;
import com.aditya.Study.Tracker.data.models.Task;
import com.aditya.Study.Tracker.service.StudyTrackerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/v1")
public class StudyTrackerController {

    private final StudyTrackerService service;

    public StudyTrackerController(StudyTrackerService service) {
        this.service = service;
    }

    // --- Task Prioritization (Max-Heap) Endpoints ---

    @PostMapping("/tasks")
    public ResponseEntity<Task> addTask(@RequestBody Map<String, Object> request) {
        try {
            String title = (String) request.get("title");
            String subject = (String) request.get("subject");
            Integer priorityScore = (Integer) request.get("priorityScore");
            LocalDate deadline = LocalDate.parse((String) request.get("deadline"));

            Task newTask = service.addTask(title, subject, priorityScore, deadline);
            return new ResponseEntity<>(newTask, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/tasks/top")
    public ResponseEntity<Task> getTopTask() {
        Task topTask = service.peekTopTask();
        return topTask != null ?
                ResponseEntity.ok(topTask) :
                ResponseEntity.noContent().build();
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<Task>> getAllTasks() {
        return ResponseEntity.ok(service.getAllTasks());
    }

    @PostMapping("/tasks/complete")
    public ResponseEntity<Task> completeTopTask(@RequestBody Map<String, Object> request) {
        try {
            double duration = ((Number) request.get("durationHours")).doubleValue();
            String notes = (String) request.getOrDefault("notes", "");

            Task completedTask = service.completeTopTask(duration, notes);
            return ResponseEntity.ok(completedTask);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }


    // --- Subject Dependencies (Graph / Topological Sort) Endpoints ---

    @PostMapping("/subjects/dependency")
    public ResponseEntity<Void> addDependency(@RequestBody Map<String, String> request) {
        String prereq = request.get("prerequisite");
        String dependent = request.get("dependent");

        if (prereq == null || dependent == null) return new ResponseEntity<>(HttpStatus.BAD_REQUEST);

        service.addDependency(prereq, dependent);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    @GetMapping("/subjects/path")
    public ResponseEntity<List<String>> getStudyPath() {
        List<String> path = service.getIdealStudyPath();
        if (path.isEmpty() && service.getSubjectsInGraph().size() > 0) {
            // Path is empty but subjects exist -> Cycle detected
            return new ResponseEntity<>(List.of("Error: Circular dependency detected."), HttpStatus.BAD_REQUEST);
        }
        return ResponseEntity.ok(path);
    }


    // --- Study Log & Reporting (ArrayList / HashMap) Endpoints ---

    @PostMapping("/logs")
    public ResponseEntity<StudyLog> insertLog(@RequestBody Map<String, Object> request) {
        try {
            String subject = (String) request.get("subject");
            double duration = ((Number) request.get("durationHours")).doubleValue();
            String description = (String) request.getOrDefault("description", "");

            StudyLog newLog = service.insertLog(subject, duration, description);
            return new ResponseEntity<>(newLog, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/logs/summary")
    public ResponseEntity<java.util.Map<String, Double>> getSummaryBySubject() {
        return ResponseEntity.ok(service.getSummaryBySubject());
    }

    @GetMapping("/logs")
    public ResponseEntity<List<StudyLog>> getAllLogs() {
        return ResponseEntity.ok(service.getAllLogs());
    }

    // --- Scheduling / Interval Tree Endpoints ---

    /**
     * POST /api/v1/schedule/block
     * Request body: { "start": "HH:mm", "end": "HH:mm" }
     * Returns 201 if added, 409 if conflict, 400 if bad input.
     */
    @PostMapping("/schedule/block")
    public ResponseEntity<String> addUnavailableBlock(@RequestBody Map<String, String> request) {
        try {
            String startStr = request.get("start");
            String endStr = request.get("end");
            if (startStr == null || endStr == null) return new ResponseEntity<>(HttpStatus.BAD_REQUEST);

            LocalTime start = LocalTime.parse(startStr);
            LocalTime end = LocalTime.parse(endStr);

            boolean added = service.addUnavailableBlock(start, end);
            if (!added) {
                return new ResponseEntity<>("Conflict: time block overlaps an existing block.", HttpStatus.CONFLICT);
            }
            return new ResponseEntity<>("Time block added.", HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * NEW: Generate weekly plan using priority (Option B).
     * POST /api/v1/schedule/weekly-plan
     * Body: { "slotsPerDay": 3 }  (optional, defaults to 3)
     * Returns 200 with JSON map: { "Monday": [ {slot, taskId, title, subject}, ... ], ... }
     */
    @PostMapping("/schedule/weekly-plan")
    public ResponseEntity<java.util.Map<String, java.util.List<java.util.Map<String, Object>>>> weeklyPlan(
            @RequestBody(required = false) Map<String, Object> request
    ) {
        try {
            int slots = 3;
            if (request != null && request.containsKey("slotsPerDay")) {
                Number n = (Number) request.get("slotsPerDay");
                if (n != null && n.intValue() > 0) slots = n.intValue();
            }
            var plan = service.generateWeeklyPlanUsingPriority(slots);
            return ResponseEntity.ok(plan);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    // --- Undo / Redo Endpoints ---

    @PostMapping("/undo")
    public ResponseEntity<String> undo() {
        String result = service.undoAction();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/redo")
    public ResponseEntity<String> redo() {
        String result = service.redoAction();
        return ResponseEntity.ok(result);
    }
}

