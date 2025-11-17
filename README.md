# 📚 Smart Study Tracking System  
Built using **React + TypeScript (Frontend)** and **Spring Boot + Java (Backend)**  
A complete DSA-based study organizer with priority scheduling, path planning, analytics, and weekly timetable system.

---

# 🚀 Overview

Smart Study Tracker is a productivity web application designed to help students:

- Plan study paths  
- Manage tasks based on priority (Max-Heap)  
- Track study logs  
- Generate weekly timetables  
- Manage unavailable time slots  
- Use undo/redo for actions  
- Visualize subject analytics  

This project also demonstrates multiple **DSA concepts** in a real-world project.

---

# 🧠 Data Structures Used

| Feature | Data Structure | Why Used? |
|--------|----------------|-----------|
| Task Priority | **Max-Heap (PriorityQueue)** | Always pick highest priority task in O(log n) |
| Subject Dependencies | **Directed Graph + Topological Sort (Kahn’s Algorithm)** | Generate correct learning order |
| Time Blocking | **Interval Tree** | Detect overlapping time intervals efficiently |
| Undo / Redo | **Two Stacks** | Reverse or reapply previous actions |
| Weekly Timetable | **Heap Copy + Greedy Algorithm** | Assign best tasks to time slots |

---

# ✨ Key Features

### ✅ Task Management  
- Add tasks  
- Priority score (1–100)  
- Auto-schedule review tasks  
- Complete tasks and log duration  

### ✅ Study Path Planner  
- Add dependencies between subjects  
- Uses **Topological Sort** to generate recommended learning order  

### ✅ Time Blocking  
- Add unavailable time blocks  
- Overlap detection using **Interval Tree**  
- Prevents conflicts  

### ✅ Weekly Timetable Generator (NEW)  
- 7-day plan  
- 3 study slots per day  
- Uses **priority-based task selection**  
- Does NOT modify your actual task queue  

### ✅ Study Analytics  
- Total hours studied per subject  
- Visual progress bars  

### ✅ Undo / Redo  
- Undo task add  
- Undo dependency add  
- Undo task complete  
- Redo all above actions  

---

# 🏗 Project Structure

```
📦 Study Tracker
 ┣ 📂 backend (Spring Boot)
 ┃ ┣ 📂 config
 ┃ ┣ 📂 data.models
 ┃ ┣ 📂 service
 ┃ ┃ ┣ 📂 data_structures
 ┃ ┃ ┣ StudyTrackerService.java
 ┃ ┣ 📂 web (Controllers)
 ┃ ┣ StudyTrackerApplication.java
 ┣ 📂 frontend (React + Vite)
 ┃ ┣ src/pages/Index.tsx
 ┃ ┣ src/components/ui
 ┃ ┣ App.tsx
 ┃ ┣ vite.config.ts
```

---

# 🛠 Backend Setup (Spring Boot)

### 📌 Requirements
- Java 17+
- Maven
- IntelliJ IDEA (recommended)

### ▶️ Start Backend

1. Open IntelliJ  
2. Load the backend folder as a Maven project  
3. Wait for `pom.xml` dependencies to download  
4. Run the main file:

```
src/main/java/com/aditya/Study/Tracker/StudyTrackerApplication.java
```

5. Server starts at:

```
http://localhost:8080
```

You should see:

```
Tomcat started on port 8080
```

---

# 🎨 Frontend Setup (React + Vite)

### 📌 Requirements
- Node.js 18+  
- npm or yarn

### ▶️ Start Frontend

Open terminal inside the frontend folder:

```
cd frontend
npm install
npm run dev
```

The UI opens at:

```
http://localhost:8081
```

---

# 🔗 API Endpoints (Important)

### **Tasks**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/tasks` | Add new task |
| GET | `/api/v1/tasks/top` | Get highest priority task |
| POST | `/api/v1/tasks/complete` | Complete top task |

### **Logs**
| Method | Endpoint |
|--------|----------|
| POST | `/api/v1/logs` |
| GET | `/api/v1/logs/summary` |

### **Dependencies**
| Method | Endpoint |
|--------|----------|
| POST | `/api/v1/subjects/dependency` |
| GET | `/api/v1/subjects/path` |

### **Time Blocking**
| Method | Endpoint |
|--------|----------|
| POST | `/api/v1/schedule/block` |

### **Weekly Plan**
| Method | Endpoint |
|--------|----------|
| POST | `/api/v1/schedule/weekly-plan` |

---

# 📅 Weekly Timetable Logic (Easy Explanation)

This is inside:

```
StudyTrackerService.java
```

### ✔ How it works

1. Copy the priority queue (Max-Heap)  
2. Loop through 7 days (Mon–Sun)  
3. Each day has 3 slots  
4. For each slot → pick the **highest priority task**  
5. Build result and return to frontend  

### 💡 DSA used:  
- **Heap (Priority Queue)**  
- **Greedy Slot Filling**  

---

# 🧪 Testing

Once both servers run:

### Visit the frontend:
```
http://localhost:8081
```

You can test:

✔ Adding tasks  
✔ Completing tasks  
✔ Adding dependencies  
✔ Weekly plan  
✔ Analytics  
✔ Time-blocking  

---

# 🖼 Screenshots (Add your images here)

```
![Dashboard](screenshots/dashboard.png)
![Weekly Plan](screenshots/weekly-plan.png)
![Path Planner](screenshots/path.png)
```

---

# 🙌 Author  
**Aditya Bhonde**  
Smart Study Tracker — DSA-Based Project

---
