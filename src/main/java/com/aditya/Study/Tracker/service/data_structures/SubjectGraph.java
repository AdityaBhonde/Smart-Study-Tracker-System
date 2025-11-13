package com.aditya.Study.Tracker.service.data_structures;

import java.util.*;

/**
 * Manages subject dependencies and runs Topological Sort (Kahn's Algorithm).
 */
public class SubjectGraph {
    // Adjacency List: Key=Subject, Value=List of subjects that depend on Key
    private final Map<String, List<String>> adjList = new HashMap<>();
    private final Set<String> allSubjects = new HashSet<>();

    public void addSubject(String subject) {
        allSubjects.add(subject);
        adjList.putIfAbsent(subject, new ArrayList<>());
    }

    /**
     * Adds a directed edge: prerequisite -> subject.
     */
    public void addDependency(String prerequisite, String subject) {
        addSubject(prerequisite);
        addSubject(subject);
        if (!adjList.get(prerequisite).contains(subject)) {
            adjList.get(prerequisite).add(subject);
        }
    }

    /**
     * Removes the directed edge: prerequisite -> subject, if present.
     * Useful for undo operations.
     */
    public void removeDependency(String prerequisite, String subject) {
        List<String> deps = adjList.get(prerequisite);
        if (deps != null) {
            deps.remove(subject);
        }
    }

    /**
     * Performs Topological Sort (Kahn's Algorithm) to find the ideal study path.
     * @return A list of subjects in the correct learning order (empty if cycle).
     */
    public List<String> getStudyPath() {
        if (allSubjects.isEmpty()) return Collections.emptyList();

        Map<String, Integer> inDegree = new HashMap<>();
        Queue<String> queue = new LinkedList<>();
        List<String> path = new ArrayList<>();

        for (String subject : allSubjects) {
            inDegree.put(subject, 0);
        }

        for (String subject : allSubjects) {
            for (String dependent : adjList.getOrDefault(subject, Collections.emptyList())) {
                inDegree.put(dependent, inDegree.getOrDefault(dependent, 0) + 1);
            }
        }

        for (String subject : allSubjects) {
            if (inDegree.getOrDefault(subject, 0) == 0) {
                queue.add(subject);
            }
        }

        while (!queue.isEmpty()) {
            String u = queue.poll();
            path.add(u);

            for (String v : adjList.getOrDefault(u, Collections.emptyList())) {
                inDegree.put(v, inDegree.get(v) - 1);
                if (inDegree.get(v) == 0) queue.add(v);
            }
        }

        if (path.size() != allSubjects.size()) {
            // cycle detected
            return Collections.emptyList();
        }

        return path;
    }

    public Set<String> getAllSubjects() {
        return Collections.unmodifiableSet(allSubjects);
    }
}
