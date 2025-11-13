package com.aditya.Study.Tracker.service.data_structures;

import com.aditya.Study.Tracker.data.models.TimeInterval;

import java.time.LocalTime;

/**
 * A simple interval tree-like structure for detecting overlaps.
 * This implementation is intentionally simple: it inserts into a BST keyed by start time
 * and rejects insertions that overlap an existing interval.
 *
 * Note: This is sufficient for the scheduling use-case (conflict detection).
 */
public class IntervalTree {

    private static class Node {
        TimeInterval interval;
        Node left, right;
        LocalTime maxEnd;

        Node(TimeInterval interval) {
            this.interval = interval;
            this.maxEnd = interval.getEnd();
        }
    }

    private Node root;

    /**
     * Insert an interval. Returns true if inserted, false if a conflict (overlap) exists.
     */
    public synchronized boolean insert(TimeInterval interval) {
        if (root == null) {
            root = new Node(interval);
            return true;
        }
        return insertNode(root, interval);
    }

    private boolean insertNode(Node node, TimeInterval interval) {
        // if overlap with current node, reject
        if (node.interval.overlaps(interval)) {
            return false;
        }

        if (interval.getStart().isBefore(node.interval.getStart())) {
            if (node.left == null) {
                node.left = new Node(interval);
            } else {
                boolean ok = insertNode(node.left, interval);
                if (!ok) return false;
            }
        } else {
            if (node.right == null) {
                node.right = new Node(interval);
            } else {
                boolean ok = insertNode(node.right, interval);
                if (!ok) return false;
            }
        }

        // update maxEnd
        if (node.maxEnd.isBefore(interval.getEnd())) {
            node.maxEnd = interval.getEnd();
        }
        return true;
    }
}
