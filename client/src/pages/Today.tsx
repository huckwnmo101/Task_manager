import { useState, useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, CheckCircle2, Clock, ListTodo } from "lucide-react";
import TaskCard from "@/components/TaskCard";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import TaskDetailDialog from "@/components/TaskDetailDialog";

export default function Today() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const { data: tasks = [], isLoading } = useTasks({});

  // Filter today's tasks
  const todayTasks = useMemo(() => {
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999)).getTime();

    return tasks.filter((task: any) => {
      if (task.isToday) return true;
      if (task.dueDate && task.dueDate >= startOfDay && task.dueDate <= endOfDay) return true;
      return false;
    }).sort((a: any, b: any) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [tasks]);

  const completedCount = todayTasks.filter((t: any) => t.isCompleted).length;
  const totalCount = todayTasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const remainingCount = totalCount - completedCount;

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "좋은 아침이에요";
    if (hour < 18) return "좋은 오후예요";
    return "좋은 저녁이에요";
  };

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="nordic-page-header">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-sm mb-1">{getGreeting()}</p>
            <h1 className="nordic-page-title">오늘의 할 일</h1>
            <p className="nordic-page-subtitle mt-1">
              {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 nordic-stagger">
        <div className="nordic-stat-card nordic-slide-up">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ListTodo className="w-5 h-5 text-primary" />
            </div>
            <span className="text-3xl font-bold">{totalCount}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">전체 태스크</p>
        </div>

        <div className="nordic-stat-card nordic-slide-up">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">완료</p>
        </div>

        <div className="nordic-stat-card nordic-slide-up">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">{remainingCount}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">남은 태스크</p>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="nordic-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">오늘의 진행률</span>
            <span className="text-sm text-muted-foreground">{completionRate}%</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground mt-4 text-sm">로딩 중...</p>
          </div>
        ) : todayTasks.length === 0 ? (
          <div className="nordic-card text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">오늘 할 일이 없습니다</h3>
            <p className="text-muted-foreground mb-6">
              새로운 태스크를 추가하여 생산적인 하루를 시작하세요
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              태스크 추가
            </Button>
          </div>
        ) : (
          <div className="space-y-3 nordic-stagger">
            {todayTasks.map((task: any, index: number) => (
              <div key={task.id} className="nordic-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
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
        defaultIsToday={true}
      />

      {selectedTaskId && (
        <TaskDetailDialog
          taskId={selectedTaskId}
          open={!!selectedTaskId}
          onOpenChange={(open) => !open && setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}
