package com.aditya.Study.Tracker.data.models;

import java.time.LocalTime;

/**
 * Represents a stored unavailable time block with an integer ID so the frontend can delete them.
 */
public class TimeBlock {
    private final int id;
    private final LocalTime start;
    private final LocalTime end;

    public TimeBlock(int id, LocalTime start, LocalTime end) {
        if (end.isBefore(start) || end.equals(start)) {
            throw new IllegalArgumentException("End time must be after start.");
        }
        this.id = id;
        this.start = start;
        this.end = end;
    }

    public int getId() { return id; }
    public LocalTime getStart() { return start; }
    public LocalTime getEnd() { return end; }

    public String toString() {
        return id + ": " + start + " - " + end;
    }
}
