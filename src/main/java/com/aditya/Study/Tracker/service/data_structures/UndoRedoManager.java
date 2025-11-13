package com.aditya.Study.Tracker.service.data_structures;

import java.util.Stack;

public class UndoRedoManager {

    private final Stack<Action> undoStack = new Stack<>();
    private final Stack<Action> redoStack = new Stack<>();

    public synchronized void record(Action action) {
        undoStack.push(action);
        redoStack.clear();
    }

    public synchronized Action undo() {
        if (undoStack.isEmpty()) return null;
        Action a = undoStack.pop();
        redoStack.push(a);
        return a;
    }

    public synchronized Action redo() {
        if (redoStack.isEmpty()) return null;
        Action a = redoStack.pop();
        undoStack.push(a);
        return a;
    }
}
