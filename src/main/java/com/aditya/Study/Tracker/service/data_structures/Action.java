package com.aditya.Study.Tracker.service.data_structures;

import com.aditya.Study.Tracker.data.models.Task;

/**
 * Represents an undoable/redoable action.
 */
public class Action {

    public enum ActionType { TASK_ADDED, TASK_COMPLETED, DEPENDENCY_ADDED }

    private final ActionType type;
    private final Task taskData;
    private final String prereq;
    private final String dependent;

    public Action(ActionType type, Task task) {
        this.type = type;
        this.taskData = task;
        this.prereq = null;
        this.dependent = null;
    }

    public Action(ActionType type, String prereq, String dependent) {
        this.type = type;
        this.prereq = prereq;
        this.dependent = dependent;
        this.taskData = null;
    }

    public ActionType getType() { return type; }
    public Task getTaskData() { return taskData; }
    public String getPrereq() { return prereq; }
    public String getDependent() { return dependent; }
}
