import { useState, useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import TaskDetailDialog from "@/components/TaskDetailDialog";
import { cn } from "@/lib/utils";

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  
  const { data: tasks = [] } = useTasks({});
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Get calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [year, month]);
  
  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = new Date(task.dueDate).toDateString();
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, task]);
      }
    });
    
    return map;
  }, [tasks]);
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month;
  };
  
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-5xl font-bold tracking-tight mb-2">캘린더</h1>
            <p className="subtitle text-lg">월간 일정을 한눈에 확인하세요</p>
          </div>
          <Button 
            size="lg" 
            onClick={() => setCreateDialogOpen(true)}
            className="rounded-full shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            새 태스크
          </Button>
        </div>
        
        {/* Calendar controls */}
        <div className="flex items-center justify-between nordic-card">
          <Button variant="outline" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">
              {year}년 {month + 1}월
            </h2>
            <Button variant="outline" onClick={goToToday}>
              오늘
            </Button>
          </div>
          
          <Button variant="outline" onClick={goToNextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="nordic-card p-6">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={cn(
                "text-center font-semibold py-2",
                index === 0 && "text-red-500",
                index === 6 && "text-blue-500"
              )}
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, index) => {
            const dateKey = date.toDateString();
            const dayTasks = tasksByDate.get(dateKey) || [];
            const isTodayDate = isToday(date);
            const isCurrentMonthDate = isCurrentMonth(date);
            
            return (
              <div
                key={index}
                className={cn(
                  "min-h-[120px] p-3 rounded-lg border transition-all hover:shadow-md",
                  isTodayDate && "bg-primary/10 border-primary",
                  !isCurrentMonthDate && "opacity-40 bg-muted/30"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-sm font-semibold",
                    isTodayDate && "text-primary",
                    index % 7 === 0 && "text-red-500",
                    index % 7 === 6 && "text-blue-500"
                  )}>
                    {date.getDate()}
                  </span>
                  {dayTasks.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {dayTasks.length}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={cn(
                        "text-xs p-2 rounded cursor-pointer hover:shadow-sm transition-all",
                        task.priority === "high" && "bg-red-100 text-red-700",
                        task.priority === "medium" && "bg-yellow-100 text-yellow-700",
                        task.priority === "low" && "bg-green-100 text-green-700",
                        task.isCompleted && "line-through opacity-60"
                      )}
                    >
                      <div className="truncate font-medium">{task.title}</div>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayTasks.length - 3} 더보기
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
