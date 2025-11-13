package com.aditya.Study.Tracker.data.models;

import java.time.LocalDate;

/**
 * Represents a finished study session.
 */
public class StudyLog {
    private final LocalDate date;
    private final String subject;
    private final double durationHours;
    private final String description;

    public StudyLog(LocalDate date, String subject, double durationHours, String description) {
        this.date = date;
        this.subject = subject;
        this.durationHours = durationHours;
        this.description = description;
    }

    // Getters
    public LocalDate getDate() { return date; }
    public String getSubject() { return subject; }
    public double getDurationHours() { return durationHours; }
    public String getDescription() { return description; }
}

