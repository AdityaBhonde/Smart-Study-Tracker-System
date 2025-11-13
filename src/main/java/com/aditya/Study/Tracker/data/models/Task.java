
package com.aditya.Study.Tracker.data.models;

import java.time.LocalDate;

/**
 * Represents a study task. Implements Comparable for PriorityQueue (Max-Heap) behavior.
 */
public class Task implements Comparable<Task> {
    private static int nextId = 1;
    private final int taskId;
    private final String title;
    private final String subject;
    private final int priorityScore;
    private final LocalDate deadline;
    private final boolean isReview;

    public Task(String title, String subject, int priorityScore, LocalDate deadline, boolean isReview) {
        this.taskId = nextId++;
        this.title = title;
        this.subject = subject;
        this.priorityScore = priorityScore;
        this.deadline = deadline;
        this.isReview = isReview;
    }

    // Constructor for new, non-review tasks (used by API)
    public Task(String title, String subject, int priorityScore, LocalDate deadline) {
        this(title, subject, priorityScore, deadline, false);
    }

    // Getters
    public int getTaskId() { return taskId; }
    public String getTitle() { return title; }
    public String getSubject() { return subject; }
    public int getPriorityScore() { return priorityScore; }
    public LocalDate getDeadline() { return deadline; }
    public boolean isReview() { return isReview; }

    /**
     * Comparison logic for the PriorityQueue (Max-Heap).
     * Compares in reverse order, so the highest priorityScore is prioritized.
     */
    @Override
    public int compareTo(Task other) {
        // Reverse order: higher score means higher priority
        return Integer.compare(other.priorityScore, this.priorityScore);
    }
}
