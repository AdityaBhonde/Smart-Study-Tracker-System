import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  CheckCircle2,
  RefreshCw,
  Link2,
  TrendingUp,
  Calendar,
  Clock,
  BookOpen,
  BarChart3,
  Target,
  Layers,
  Activity,
  Menu,
  X,
  Home,
  Settings,
  Award,
  Zap,
  RotateCcw,
  RotateCw
} from "lucide-react";

const BASE_URL = 'http://localhost:8080/api/v1';

interface Task {
  title: string;
  subject: string;
  priorityScore: number;
  deadline: string;
  review?: boolean;
}

interface WeeklyTask {
  slot: string;
  taskId: number;
  title: string;
  subject: string;
}

interface SubjectSummary {
  [subject: string]: number;
}

const Index = () => {
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskSubject, setTaskSubject] = useState("");
  const [taskScore, setTaskScore] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");

  // Top task state
  const [topTask, setTopTask] = useState<Task | null>(null);
  const [topTaskLoading, setTopTaskLoading] = useState(false);
  const [completeDuration, setCompleteDuration] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");

  // Dependency state
  const [prereqSubject, setPrereqSubject] = useState("");
  const [dependentSubject, setDependentSubject] = useState("");
  const [studyPath, setStudyPath] = useState<string[]>([]);
  const [pathLoading, setPathLoading] = useState(false);

  // Manual log state
  const [manualSubject, setManualSubject] = useState("");
  const [manualDuration, setManualDuration] = useState("");
  const [manualNotes, setManualNotes] = useState("");

  // Summary state
  const [summary, setSummary] = useState<SubjectSummary>({});
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Scheduling UI
  const [blockStart, setBlockStart] = useState("09:00");
  const [blockEnd, setBlockEnd] = useState("10:00");
  const [blockLoading, setBlockLoading] = useState(false);

  // Undo/Redo loading
  const [undoLoading, setUndoLoading] = useState(false);
  const [redoLoading, setRedoLoading] = useState(false);

  // Weekly plan state (Updated to reflect backend structure)
  const [weeklyPlan, setWeeklyPlan] = useState<Record<string, WeeklyTask[]>>({});
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  const apiCall = async (endpoint: string, method = 'GET', data: any = null) => {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (data) options.body = JSON.stringify(data);

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, options);
      if (response.status === 204) return null;
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return response.json();
        }
        return {};
      }
      const errorText = await response.text();
      toast({
        title: "API Error",
        description: `${response.status}: ${errorText.substring(0, 120)}`,
        variant: "destructive",
      });
      return null;
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Cannot connect to Spring Boot backend. Is it running on port 8080?",
        variant: "destructive",
      });
      return null;
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const loadTopTask = async () => {
    setTopTaskLoading(true);
    const task = await apiCall('/tasks/top');
    setTopTask(task);
    setTopTaskLoading(false);
  };

  const addTask = async () => {
    if (!taskTitle || !taskSubject || !taskScore || !taskDeadline) {
      toast({
        title: "Validation Error",
        description: "Please fill out all fields with a score between 1 and 100.",
        variant: "destructive",
      });
      return;
    }

    const score = parseInt(taskScore);
    if (score < 1 || score > 100) {
      toast({
        title: "Invalid Score",
        description: "Priority score must be between 1 and 100.",
        variant: "destructive",
      });
      return;
    }

    const data = { title: taskTitle, subject: taskSubject, priorityScore: score, deadline: taskDeadline };
    const newTask = await apiCall('/tasks', 'POST', data);

    if (newTask) {
      toast({ title: "Task Added", description: `"${newTask.title}" added to Priority Queue!` });
      setTaskTitle("");
      setTaskSubject("");
      setTaskScore("");
      setTaskDeadline("");
      loadTopTask();
    }
  };

  const completeTopTask = async () => {
    const durationHours = parseFloat(completeDuration);
    if (isNaN(durationHours) || durationHours <= 0) {
      toast({
        title: "Invalid Duration",
        description: "Please enter a valid study duration (hours).",
        variant: "destructive",
      });
      return;
    }

    const data = { durationHours, notes: completeNotes };
    const completedTask = await apiCall('/tasks/complete', 'POST', data);

    if (completedTask) {
      toast({
        title: "Task Completed",
        description: `Completed "${completedTask.title}". Logged ${durationHours}h!`,
      });
      setCompleteDuration("");
      setCompleteNotes("");
      loadTopTask();
      loadSummary();
    }
  };

  const addDependency = async () => {
    if (!prereqSubject || !dependentSubject) {
      toast({
        title: "Missing Information",
        description: "Both Prerequisite and Dependent subjects are required.",
        variant: "destructive",
      });
      return;
    }

    const data = { prerequisite: prereqSubject, dependent: dependentSubject };
    const response = await apiCall('/subjects/dependency', 'POST', data);

    if (response || response === null) {
      toast({ title: "Dependency Added", description: `${prereqSubject} → ${dependentSubject}` });
      setPrereqSubject("");
      setDependentSubject("");
    }
  };

  const calculateStudyPath = async () => {
    setPathLoading(true);
    const path = await apiCall('/subjects/path');

    if (path && Array.isArray(path)) {
      if (path.length > 0 && typeof path[0] === "string" && (path[0] as string).startsWith("Error:")) {
        toast({ title: "Path Error", description: path[0] as string, variant: "destructive" });
        setStudyPath([]);
      } else if (path.length > 0) {
        setStudyPath(path);
        toast({ title: "Path Calculated", description: "Ideal study path calculated successfully." });
      } else {
        setStudyPath([]);
        toast({ title: "No Dependencies", description: "No subjects or dependencies defined yet." });
      }
    }
    setPathLoading(false);
  };

  const loadSummary = async () => {
    setSummaryLoading(true);
    const summaryData = await apiCall('/logs/summary');
    if (summaryData) {
      setSummary(summaryData);
    }
    setSummaryLoading(false);
  };

  const logManualSession = async () => {
    const durationHours = parseFloat(manualDuration);
    if (!manualSubject || isNaN(durationHours) || durationHours <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please provide a subject, positive duration, and description.",
        variant: "destructive",
      });
      return;
    }

    const data = { subject: manualSubject, durationHours, description: manualNotes };
    const newLog = await apiCall('/logs', 'POST', data);

    if (newLog) {
      toast({ title: "Session Logged", description: `Manual session logged for ${manualSubject} (${durationHours}h).` });
      setManualSubject("");
      setManualDuration("");
      setManualNotes("");
      loadSummary();
    }
  };

  // New: Add Unavailable Time Block (Interval Tree)
  const addTimeBlock = async () => {
    setBlockLoading(true);
    try {
      const data = { start: blockStart, end: blockEnd };
      const response = await fetch(`${BASE_URL}/schedule/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.status === 201) {
        toast({ title: "Block Added", description: `${blockStart} → ${blockEnd} added to unavailable blocks.` });
        setBlockStart("09:00");
        setBlockEnd("10:00");
      } else if (response.status === 409) {
        const text = await response.text();
        toast({ title: "Schedule Conflict", description: text, variant: "destructive" });
      } else {
        const text = await response.text();
        toast({ title: "Error", description: `${response.status}: ${text}`, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Network Error", description: "Could not reach backend.", variant: "destructive" });
    }
    setBlockLoading(false);
  };

  // New: Undo / Redo actions
  const undoAction = async () => {
    setUndoLoading(true);
    const res = await apiCall('/undo', 'POST');
    if (res !== null) {
      // service returns a string message
      if (typeof res === 'string') {
        toast({ title: "Undo", description: res });
      } else if ((res as any).message) {
        toast({ title: "Undo", description: (res as any).message });
      } else {
        toast({ title: "Undo", description: "Undo executed." });
      }
      // refresh UI
      loadTopTask();
      loadSummary();
    }
    setUndoLoading(false);
  };

  const redoAction = async () => {
    setRedoLoading(true);
    const res = await apiCall('/redo', 'POST');
    if (res !== null) {
      if (typeof res === 'string') {
        toast({ title: "Redo", description: res });
      } else if ((res as any).message) {
        toast({ title: "Redo", description: (res as any).message });
      } else {
        toast({ title: "Redo", description: "Redo executed." });
      }
      loadTopTask();
      loadSummary();
    }
    setRedoLoading(false);
  };

  const generateWeeklyPlan = async () => {
    setWeeklyLoading(true);
    const result = await apiCall('/schedule/weekly-plan', 'POST');

    if (result) {
      setWeeklyPlan(result);
      toast({
        title: "Weekly Plan Generated",
        description: "Your 7-day timetable has been created based on task priority."
      });
    }
    setWeeklyLoading(false);
  };

  useEffect(() => {
    loadTopTask();
    loadSummary();
  }, []);

  const totalHours = Object.values(summary).reduce((acc, val) => acc + val, 0);
  const subjectCount = Object.keys(summary).length;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-card border-r border-border flex flex-col shadow-elevated`}>
        <div className={`${sidebarOpen ? 'block' : 'hidden'} flex-1 overflow-hidden`}>
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">StudyTracker</h2>
                <p className="text-xs text-muted-foreground">Pro Dashboard</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === "overview"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("tasks")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === "tasks"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Target className="w-5 h-5" />
              <span className="font-medium">Tasks</span>
            </button>

            <button
              onClick={() => setActiveTab("planner")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === "planner"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Layers className="w-5 h-5" />
              <span className="font-medium">Path Planner</span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === "analytics"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Analytics</span>
            </button>
          </nav>

          {/* Footer Stats */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card/50 backdrop-blur">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Hours</span>
              <span className="font-bold text-primary">{totalHours.toFixed(1)}h</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Subjects</span>
              <span className="font-bold text-secondary">{subjectCount}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "tasks" && "Task Management"}
                {activeTab === "planner" && "Study Path Planner"}
                {activeTab === "analytics" && "Time Analytics"}
              </h1>
              <p className="text-xs text-muted-foreground">Smart Study Tracking System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-muted rounded-lg flex items-center gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Backend Status</p>
                <p className="text-sm font-semibold text-success">● Connected</p>
              </div>
            </div>

            {/* Undo / Redo Buttons */}
            <div className="flex items-center gap-2">
              <Button onClick={undoAction} disabled={undoLoading} className="h-10">
                <RotateCcw className="w-4 h-4 mr-2" />
                Undo
              </Button>
              <Button onClick={redoAction} disabled={redoLoading} className="h-10">
                <RotateCw className="w-4 h-4 mr-2" />
                Redo
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-card border-border/50 hover:shadow-elevated transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Hours</p>
                        <h3 className="text-3xl font-bold text-foreground mt-1">{totalHours.toFixed(1)}</h3>
                      </div>
                      <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card border-border/50 hover:shadow-elevated transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Subjects</p>
                        <h3 className="text-3xl font-bold text-foreground mt-1">{subjectCount}</h3>
                      </div>
                      <div className="w-12 h-12 rounded-full gradient-secondary flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card border-border/50 hover:shadow-elevated transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Top Priority</p>
                        <h3 className="text-xl font-bold text-foreground mt-1 truncate">
                          {topTask ? topTask.priorityScore : "--"}
                        </h3>
                      </div>
                      <div className="w-12 h-12 rounded-full gradient-success flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card border-border/50 hover:shadow-elevated transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Study Path</p>
                        <h3 className="text-3xl font-bold text-foreground mt-1">{studyPath.length}</h3>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-warning" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Current Task & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Task */}
                <Card className="shadow-elevated border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      Current Priority Task
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topTaskLoading ? (
                      <div className="p-8 text-center text-muted-foreground">Loading...</div>
                    ) : topTask ? (
                      <div className="space-y-4">
                        <div className="p-6 glass-morphism rounded-xl border border-primary/30">
                          <h3 className="text-2xl font-bold text-primary mb-3">{topTask.title}</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Score:</span>
                              <span className="font-bold">{topTask.priorityScore}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Due:</span>
                              <span className="font-bold">{formatDate(topTask.deadline)}</span>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-border/30">
                            <span className="text-sm text-muted-foreground">Subject: </span>
                            <span className="text-sm font-semibold text-secondary">{topTask.subject}</span>
                          </div>
                        </div>
                        <Button onClick={completeTopTask} className="w-full gradient-primary hover:opacity-90 h-12">
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Complete Task
                        </Button>
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto rounded-full gradient-success flex items-center justify-center mb-4">
                          <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-xl font-bold text-success mb-2">All Clear!</p>
                        <p className="text-muted-foreground">No pending tasks</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Log */}
                <Card className="shadow-elevated border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-secondary" />
                      Quick Session Log
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Subject Name"
                      value={manualSubject}
                      onChange={(e) => setManualSubject(e.target.value)}
                      className="bg-input border-border/50 h-12"
                    />
                    <Input
                      type="number"
                      placeholder="Duration (hours)"
                      step="0.1"
                      value={manualDuration}
                      onChange={(e) => setManualDuration(e.target.value)}
                      className="bg-input border-border/50 h-12"
                    />
                    <Textarea
                      placeholder="Notes"
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      className="bg-input border-border/50 min-h-[100px] resize-none"
                    />
                    <Button onClick={logManualSession} className="w-full gradient-secondary hover:opacity-90 h-12">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Log Session
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Study Summary */}
              <Card className="shadow-elevated border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-accent" />
                    Study Summary by Subject
                  </CardTitle>
                  <Button
                    onClick={loadSummary}
                    variant="outline"
                    size="sm"
                    disabled={summaryLoading}
                    className="border-border/50"
                  >
                    <RefreshCw className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.keys(summary).length > 0 && Object.keys(summary).sort().map((subject) => (
                      <div key={subject} className="p-4 glass-morphism rounded-lg hover:border-primary/50 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-foreground">{subject}</span>
                          <span className="text-lg font-bold text-primary">{summary[subject].toFixed(1)}h</span>
                        </div>
                        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-primary"
                            style={{ width: `${(summary[subject] / (totalHours || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Task */}
                <Card className="shadow-elevated border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5 text-primary" />
                      Add New Task
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Task Title"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="bg-input border-border/50 h-12"
                    />
                    <Input
                      placeholder="Subject"
                      value={taskSubject}
                      onChange={(e) => setTaskSubject(e.target.value)}
                      className="bg-input border-border/50 h-12"
                    />
                    <Input
                      type="number"
                      placeholder="Priority Score (min 1-100 max)"
                      min="1"
                      max="100"
                      value={taskScore}
                      onChange={(e) => setTaskScore(e.target.value)}
                      className="bg-input border-border/50 h-12"
                    />
                    <Input
                      type="date"
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                      className="bg-input border-border/50 h-12"
                    />
                    <Button onClick={addTask} className="w-full gradient-primary hover:opacity-90 h-12">
                      <Plus className="w-5 h-5 mr-2" />
                      Add Task
                    </Button>
                  </CardContent>
                </Card>

                {/* Complete Task */}
                <Card className="shadow-elevated border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      Complete Current Task
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {topTask ? (
                      <>
                        <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                          <p className="font-bold text-lg text-primary">{topTask.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{topTask.subject}</p>
                        </div>
                        <Input
                          type="number"
                          placeholder="Duration (hours)"
                          step="0.1"
                          value={completeDuration}
                          onChange={(e) => setCompleteDuration(e.target.value)}
                          className="bg-input border-border/50 h-12"
                        />
                        <Textarea
                          placeholder="Notes"
                          value={completeNotes}
                          onChange={(e) => setCompleteNotes(e.target.value)}
                          className="bg-input border-border/50 min-h-[100px] resize-none"
                        />
                        <Button onClick={completeTopTask} className="w-full gradient-success hover:opacity-90 h-12">
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Mark Complete
                        </Button>
                      </>
                    ) : (
                      <div className="p-12 text-center text-muted-foreground">
                        <p>No active task</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Planner Tab */}
          {activeTab === "planner" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Weekly Timetable Generator */}
                <Card className="shadow-elevated border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Weekly Timetable (Priority Based)
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <Button
                      onClick={generateWeeklyPlan}
                      disabled={weeklyLoading}
                      className="w-full gradient-primary h-12"
                    >
                      {weeklyLoading ? "Generating..." : "Generate Weekly Plan"}
                    </Button>

                    {/* Display the timetable - FIXED BLOCK */}
                    {Object.keys(weeklyPlan).length > 0 ? (
                      <div className="space-y-4 mt-4">
                        {Object.entries(weeklyPlan).map(([day, tasks]) => (
                          <div
                            key={day}
                            className="p-4 border border-border/50 rounded-lg glass-morphism"
                          >
                            <h3 className="text-lg font-bold text-primary mb-2">{day}</h3>

                            {tasks.length > 0 ? (
                              <ul className="ml-4 space-y-1">
                                {tasks.map((t: WeeklyTask, i: number) => (
                                  <li key={i} className="text-sm">
                                    <b className="font-semibold text-accent">{t.slot}</b>: {t.title}
                                    <span className="text-muted-foreground"> ({t.subject})</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted-foreground">No tasks</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2">
                        Click "Generate Weekly Plan" to see your timetable.
                      </p>
                    )}
                    {/* END OF FIXED BLOCK */}
                  </CardContent>
                </Card>

                {/* Study Path */}
                <Card className="shadow-elevated border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-accent" />
                      Recommended Learning Path
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {studyPath.length > 0 ? (
                        studyPath.map((subject, index) => (
                          <div key={index} className="flex items-center gap-4 p-4 glass-morphism rounded-lg hover:border-accent/50 transition-colors">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full gradient-primary flex items-center justify-center font-bold text-white shadow-glow">
                              {index + 1}
                            </div>
                            <span className="flex-1 font-medium text-foreground">{subject}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 text-center text-muted-foreground">
                          <p>Add dependencies and calculate path</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Add Dependencies */}
                <Card className="shadow-elevated border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Link2 className="w-5 h-5 text-secondary" />
                      Subject Dependencies
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Prerequisite Subject"
                      value={prereqSubject}
                      onChange={(e) => setPrereqSubject(e.target.value)}
                      className="bg-input border-border/50 h-12"
                    />
                    <Input
                      placeholder="Dependent Subject"
                      value={dependentSubject}
                      onChange={(e) => setDependentSubject(e.target.value)}
                      className="bg-input border-border/50 h-12"
                    />
                    <Button onClick={addDependency} className="w-full gradient-secondary hover:opacity-90 h-12">
                      <Link2 className="w-5 h-5 mr-2" />
                      Add Dependency
                    </Button>
                    <Button
                      onClick={calculateStudyPath}
                      disabled={pathLoading}
                      className="w-full gradient-hero hover:opacity-90 h-12"
                    >
                      <TrendingUp className="w-5 h-5 mr-2" />
                      {pathLoading ? "Calculating..." : "Calculate Study Path"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Add Unavailable Time Block */}
                <Card className="shadow-elevated border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-accent" />
                      Add Unavailable Time Block
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="time"
                        value={blockStart}
                        onChange={(e) => setBlockStart(e.target.value)}
                        className="bg-input border-border/50 h-12"
                      />
                      <Input
                        type="time"
                        value={blockEnd}
                        onChange={(e) => setBlockEnd(e.target.value)}
                        className="bg-input border-border/50 h-12"
                      />
                    </div>
                    <Button onClick={addTimeBlock} disabled={blockLoading} className="w-full gradient-primary h-12">
                      {blockLoading ? "Adding..." : "Add Time Block"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">Blocks are checked for overlap; conflicts are rejected.</p>
                  </CardContent>
                </Card>

              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <Card className="shadow-elevated border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Time Analytics Dashboard
                  </CardTitle>
                  <Button
                    onClick={loadSummary}
                    disabled={summaryLoading}
                    className="gradient-secondary hover:opacity-90"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${summaryLoading ? 'animate-spin' : ''}`} />
                    Refresh Data
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.keys(summary).sort().map((subject) => {
                      const percentage = ((summary[subject] / (totalHours || 1)) * 100).toFixed(1);
                      return (
                        <div key={subject} className="p-6 glass-morphism rounded-xl hover:shadow-glow transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-foreground">{subject}</h3>
                            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total Hours</span>
                              <span className="font-bold text-primary">{summary[subject].toFixed(2)}h</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Percentage</span>
                              <span className="font-bold text-secondary">{percentage}%</span>
                            </div>
                            <div className="mt-3 h-3 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full gradient-hero transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {Object.keys(summary).length === 0 && (
                    <div className="p-12 text-center text-muted-foreground">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No study data available yet</p>
                      <p className="text-sm mt-2">Start logging sessions to see analytics</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
