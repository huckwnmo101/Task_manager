import { useState, useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, X, ListTodo, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import TaskCard from "@/components/TaskCard";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import TaskDetailDialog from "@/components/TaskDetailDialog";

export default function AllTasks() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created");

  const { data: tasks = [], isLoading } = useTasks({});

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((task: any) =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((task: any) => task.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      result = result.filter((task: any) => task.priority === priorityFilter);
    }

    // Sort
    result.sort((a: any, b: any) => {
      if (sortBy === "created") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "dueDate") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate - b.dueDate;
      } else if (sortBy === "priority") {
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [tasks, searchQuery, statusFilter, priorityFilter, sortBy]);

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      completed: tasks.filter((t: any) => t.isCompleted).length,
      inProgress: tasks.filter((t: any) => t.status === "in_progress").length,
      todo: tasks.filter((t: any) => t.status === "todo").length,
    };
  }, [tasks]);

  const hasActiveFilters = searchQuery || statusFilter !== "all" || priorityFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="nordic-page-header">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="nordic-page-title">모든 태스크</h1>
            <p className="nordic-page-subtitle mt-1">전체 태스크를 관리하고 필터링하세요</p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="rounded-xl h-11 px-5 font-medium shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 태스크
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 nordic-stagger">
        <div className="nordic-stat-card nordic-slide-up">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <ListTodo className="w-4 h-4 text-primary" />
            </div>
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">전체</p>
        </div>

        <div className="nordic-stat-card nordic-slide-up">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <PlayCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">진행중</p>
        </div>

        <div className="nordic-stat-card nordic-slide-up">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-2xl font-bold">{stats.todo}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">대기</p>
        </div>

        <div className="nordic-stat-card nordic-slide-up">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">완료</p>
        </div>
      </div>

      {/* Filters */}
      <div className="nordic-card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="md:col-span-2 lg:col-span-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="태스크 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-lg border-border/50"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 rounded-lg border-border/50">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 상태</SelectItem>
              <SelectItem value="todo">대기</SelectItem>
              <SelectItem value="in_progress">진행중</SelectItem>
              <SelectItem value="done">완료</SelectItem>
              <SelectItem value="hold">보류</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-10 rounded-lg border-border/50">
              <SelectValue placeholder="우선순위" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 우선순위</SelectItem>
              <SelectItem value="high">높음</SelectItem>
              <SelectItem value="medium">중간</SelectItem>
              <SelectItem value="low">낮음</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-10 rounded-lg border-border/50">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">생성일</SelectItem>
              <SelectItem value="dueDate">마감일</SelectItem>
              <SelectItem value="priority">우선순위</SelectItem>
              <SelectItem value="title">제목</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filteredTasks.length}</span>개의 태스크 표시 중
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              필터 초기화
            </Button>
          </div>
        )}
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground mt-4 text-sm">로딩 중...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="nordic-card text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
              <ListTodo className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">태스크가 없습니다</h3>
            <p className="text-muted-foreground mb-6">
              {hasActiveFilters
                ? "필터 조건에 맞는 태스크가 없습니다"
                : "새로운 태스크를 추가하여 시작하세요"
              }
            </p>
            {!hasActiveFilters && (
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                태스크 추가
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task: any, index: number) => (
              <div
                key={task.id}
                className="nordic-slide-up"
                style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
              >
                <TaskCard
                  task={task}
                  onClick={() => setSelectedTaskId(task.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedTaskId && (
        <TaskDetailDialog
          taskId={selectedTaskId}
          open={!!selectedTaskId}
          onOpenChange={(open: boolean) => !open && setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}
