package com.aditya.Study.Tracker.service;

import com.aditya.Study.Tracker.data.models.StudyLog;
import com.aditya.Study.Tracker.data.models.Task;
import com.aditya.Study.Tracker.data.models.TimeInterval;
import com.aditya.Study.Tracker.service.data_structures.Action;
import com.aditya.Study.Tracker.service.data_structures.IntervalTree;
import com.aditya.Study.Tracker.service.data_structures.SubjectGraph;
import com.aditya.Study.Tracker.service.data_structures.UndoRedoManager;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Manages the core data structures and business logic of the study tracker.
 * This class simulates persistent storage in memory.
 */
@Service
public class StudyTrackerService {

    // DS 1: For future tasks (Max-Heap based on Task priorityScore)
    private final PriorityQueue<Task> taskQueue = new PriorityQueue<>();

    // DS 2: For finished logs (ArrayList)
    private final List<StudyLog> studyLogs = new ArrayList<>();

    // DS 3: Subject dependency graph
    private final SubjectGraph subjectGraph = new SubjectGraph();

    // DS 4: Interval tree for unavailable time blocks
    private final IntervalTree intervalTree = new IntervalTree();

    // DS 5: Undo/Redo manager
    private final UndoRedoManager undoRedoManager = new UndoRedoManager();

    // --- Task Prioritization Methods (PriorityQueue / Max-Heap) ---

    public synchronized Task addTask(String title, String subject, int priorityScore, LocalDate deadline) {
        Task newTask = new Task(title, subject, priorityScore, deadline);
        taskQueue.add(newTask); // O(log n)
        subjectGraph.addSubject(subject);

        // record for undo (task added)
        undoRedoManager.record(new Action(Action.ActionType.TASK_ADDED, newTask));
        return newTask;
    }

    public synchronized Task peekTopTask() {
        return taskQueue.peek(); // O(1)
    }

    public synchronized List<Task> getAllTasks() {
        // Return tasks in priority order without modifying underlying queue
        return taskQueue.stream().sorted().collect(Collectors.toList());
    }

    /**
     * Marks the top priority task as complete and schedules a review.
     */
    public synchronized Task completeTopTask(double durationHours, String notes) {
        Task completedTask = taskQueue.poll(); // O(log n)
        if (completedTask == null) {
            throw new NoSuchElementException("The task queue is empty.");
        }

        // Log completion
        autoLogCompletion(completedTask, durationHours, notes);

        // Schedule review
        scheduleNextReview(completedTask);

        // record for undo (task completed)
        undoRedoManager.record(new Action(Action.ActionType.TASK_COMPLETED, completedTask));

        return completedTask;
    }

    private void autoLogCompletion(Task completedTask, double durationHours, String notes) {
        StudyLog newLog = new StudyLog(
                LocalDate.now(),
                completedTask.getSubject(),
                durationHours,
                completedTask.getTitle() + (notes == null || notes.isEmpty() ? "" : ": " + notes)
        );
        studyLogs.add(newLog);
    }

    private void scheduleNextReview(Task completedTask) {
        int reviewIntervalDays = 3;
        LocalDate reviewDate = LocalDate.now().plusDays(reviewIntervalDays);
        int reviewPriority = 85;

        String reviewTitle = completedTask.isReview() ?
                "Review: " + completedTask.getTitle().replaceFirst("Review: ", "") :
                "Review: " + completedTask.getTitle();

        Task reviewTask = new Task(
                reviewTitle,
                completedTask.getSubject(),
                reviewPriority,
                reviewDate,
                true
        );

        taskQueue.add(reviewTask);
    }

    // --- Study Log Methods ---

    public synchronized StudyLog insertLog(String subject, double durationHours, String description) {
        StudyLog newLog = new StudyLog(LocalDate.now(), subject, durationHours, description);
        studyLogs.add(newLog);
        subjectGraph.addSubject(subject);
        return newLog;
    }

    public synchronized List<StudyLog> getAllLogs() {
        return Collections.unmodifiableList(studyLogs);
    }

    public synchronized Map<String, Double> getSummaryBySubject() {
        Map<String, Double> durationBySubject = new HashMap<>();
        for (StudyLog log : studyLogs) {
            durationBySubject.compute(log.getSubject(), (k, v) -> (v == null) ? log.getDurationHours() : v + log.getDurationHours());
        }
        return durationBySubject;
    }

    // --- Subject Dependency Methods (Graph) ---

    public synchronized void addDependency(String prerequisite, String subject) {
        subjectGraph.addDependency(prerequisite, subject);
        // record for undo
        undoRedoManager.record(new Action(Action.ActionType.DEPENDENCY_ADDED, prerequisite, subject));
    }

    public synchronized List<String> getIdealStudyPath() {
        return subjectGraph.getStudyPath();
    }

    public synchronized Set<String> getSubjectsInGraph() {
        return subjectGraph.getAllSubjects();
    }

    // --- Interval Tree Methods (Scheduling) ---

    /**
     * Adds an unavailable time block. Times must be in HH:mm format (LocalTime).
     * Returns true if added (no conflict), false if a conflict exists.
     */
    public synchronized boolean addUnavailableBlock(LocalTime start, LocalTime end) {
        TimeInterval t = new TimeInterval(start, end);
        return intervalTree.insert(t);
    }

    // --- Undo / Redo ---

    public synchronized String undoAction() {
        var action = undoRedoManager.undo();
        if (action == null) return "Nothing to undo.";

        switch (action.getType()) {
            case TASK_ADDED:
                // remove the task (if still present)
                taskQueue.remove(action.getTaskData());
                return "Undo: Task addition removed.";
            case TASK_COMPLETED:
                // re-add the completed task back to queue
                taskQueue.add(action.getTaskData());
                return "Undo: Task completion reversed (task re-added).";
            case DEPENDENCY_ADDED:
                subjectGraph.removeDependency(action.getPrereq(), action.getDependent());
                return "Undo: Dependency removed.";
            default:
                return "Unsupported undo action.";
        }
    }

    public synchronized String redoAction() {
        var action = undoRedoManager.redo();
        if (action == null) return "Nothing to redo.";

        switch (action.getType()) {
            case TASK_ADDED:
                taskQueue.add(action.getTaskData());
                return "Redo: Task added again.";
            case TASK_COMPLETED:
                taskQueue.remove(action.getTaskData());
                return "Redo: Task marked completed again.";
            case DEPENDENCY_ADDED:
                subjectGraph.addDependency(action.getPrereq(), action.getDependent());
                return "Redo: Dependency added again.";
            default:
                return "Unsupported redo action.";
        }
    }

    // --------------------------------------------------------------------------
    // NEW: Weekly timetable generator using PriorityQueue (Option B)
    // --------------------------------------------------------------------------
    /**
     * Generate a weekly timetable (Mon-Sun) with `slotsPerDay` slots each day.
     * This uses the current task priorities. It does NOT remove tasks from the
     * real taskQueue; it builds the schedule from a snapshot.
     *
     * Scheduling strategy (priority-based):
     *  - Build a list of tasks sorted descending by priority (highest first)
     *  - Fill each day's slots sequentially from that list (cyclically) so top tasks
     *    are scheduled earlier in the week and repeated if necessary.
     *
     * Return format:
     *   Map<String, List<Map<String,Object>>> where key is day name (e.g., "Monday")
     *   and each list item is a map: { "slot": 1, "taskId": int, "title": string, "subject": string }
     */
    public synchronized Map<String, List<Map<String, Object>>> generateWeeklyPlanUsingPriority(int slotsPerDay) {
        List<Task> sortedTasks = getAllTasks(); // already sorted by priority descending
        Map<String, List<Map<String, Object>>> weekPlan = new LinkedHashMap<>();

        // Days order: Monday -> Sunday
        String[] days = { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" };

        if (sortedTasks.isEmpty() || slotsPerDay <= 0) {
            // return empty plan structure
            for (String day : days) weekPlan.put(day, new ArrayList<>());
            return weekPlan;
        }

        // We will cycle through sortedTasks to fill slots across days to give high-priority tasks
        // earlier positions but allow repetition across days if there are fewer tasks than slots/day*7.
        int index = 0;
        int n = sortedTasks.size();

        for (String day : days) {
            List<Map<String, Object>> daySlots = new ArrayList<>();
            for (int slot = 1; slot <= slotsPerDay; slot++) {
                Task t = sortedTasks.get(index % n);
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("slot", slot);
                entry.put("taskId", t.getTaskId());
                entry.put("title", t.getTitle());
                entry.put("subject", t.getSubject());
                // Optional: approximate times can be added by frontend; keep simple here
                daySlots.add(entry);
                index++;
            }
            weekPlan.put(day, daySlots);
        }

        return weekPlan;
    }
}

