package com.aditya.Study.Tracker.data.models;

import java.time.LocalTime;

public class TimeInterval {
    private final LocalTime start;
    private final LocalTime end;

    public TimeInterval(LocalTime start, LocalTime end) {
        if (end.isBefore(start) || end.equals(start)) {
            throw new IllegalArgumentException("End time must be after start.");
        }
        this.start = start;
        this.end = end;
    }

    public LocalTime getStart() { return start; }
    public LocalTime getEnd() { return end; }

    public boolean overlaps(TimeInterval other) {
        // overlap if start < other.end && other.start < end
        return this.start.isBefore(other.end) && other.start.isBefore(this.end);
    }

    @Override
    public String toString() {
        return start + " - " + end;
    }
}
