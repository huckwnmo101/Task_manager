import { useState } from "react";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Flag, Calendar, CheckCircle2, ArrowUp } from "lucide-react";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import TaskDetailDialog from "@/components/TaskDetailDialog";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Status = "todo" | "in_progress" | "done" | "hold";

export default function KanbanBoard() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);
  
  const { data: tasks = [], isLoading } = useTasks({});
  const updateTask = useUpdateTask();
  
  const columns: { status: Status; label: string; color: string; bgColor: string; borderColor: string }[] = [
    { 
      status: "todo", 
      label: "대기", 
      color: "text-gray-700",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200"
    },
    { 
      status: "in_progress", 
      label: "진행중", 
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    { 
      status: "done", 
      label: "완료", 
      color: "text-green-700",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    { 
      status: "hold", 
      label: "보류", 
      color: "text-orange-700",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    },
  ];
  
  const getTasksByStatus = (status: Status) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };
  
  const handleDragStart = (taskId: number) => {
    setDraggedTaskId(taskId);
  };
  
  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };
  
  const handleDragOver = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    setDragOverColumn(status);
  };
  
  const handleDragLeave = () => {
    setDragOverColumn(null);
  };
  
  const handleDrop = (status: Status) => {
    if (draggedTaskId) {
      updateTask.mutate({ id: draggedTaskId, status });
      setDraggedTaskId(null);
      setDragOverColumn(null);
    }
  };
  
  const priorityConfig = {
    high: { label: "높음", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" },
    medium: { label: "중간", color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" },
    low: { label: "낮음", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-5xl font-bold tracking-tight mb-2">칸반 보드</h1>
            <p className="subtitle text-lg">드래그 앤 드롭으로 태스크 상태를 변경하세요</p>
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
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {columns.map(column => {
          const columnTasks = getTasksByStatus(column.status);
          const isOver = dragOverColumn === column.status;
          
          return (
            <div
              key={column.status}
              className="flex flex-col h-[calc(100vh-280px)] min-h-[600px]"
            >
              {/* Column header */}
              <div className={cn(
                "rounded-t-2xl p-4 border-b-2 transition-all",
                column.bgColor,
                column.borderColor,
                isOver && "ring-2 ring-primary ring-offset-2"
              )}>
                <div className="flex items-center justify-between">
                  <h2 className={cn("text-lg font-bold", column.color)}>
                    {column.label}
                  </h2>
                  <Badge 
                    variant="secondary" 
                    className={cn("font-semibold", column.color)}
                  >
                    {columnTasks.length}
                  </Badge>
                </div>
              </div>
              
              {/* Column content */}
              <div
                className={cn(
                  "flex-1 rounded-b-2xl p-4 space-y-3 overflow-y-auto nordic-scrollbar transition-all border-2 border-t-0",
                  column.borderColor,
                  isOver ? "bg-primary/5 ring-2 ring-primary ring-offset-2" : "bg-muted/20"
                )}
                onDragOver={(e) => handleDragOver(e, column.status)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(column.status)}
              >
                {columnTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                      column.bgColor
                    )}>
                      <CheckCircle2 className={cn("w-8 h-8", column.color, "opacity-40")} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isOver ? "여기에 놓으세요" : "태스크가 없습니다"}
                    </p>
                  </div>
                ) : (
                  columnTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={cn(
                        "group bg-card p-4 rounded-xl border-2 cursor-move transition-all",
                        "hover:shadow-lg hover:scale-[1.02] hover:border-primary/50",
                        task.isCompleted && "opacity-60",
                        draggedTaskId === task.id && "opacity-30 scale-95"
                      )}
                    >
                      {/* Priority badge */}
                      <div className="flex items-start justify-between mb-3">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs font-semibold border-2 gap-1",
                            priorityConfig[task.priority].color,
                            priorityConfig[task.priority].bgColor,
                            priorityConfig[task.priority].borderColor
                          )}
                        >
                          {task.priority === 'high' && <ArrowUp className="w-3 h-3" />}
                          {task.priority !== 'high' && <Flag className="w-3 h-3" />}
                          {priorityConfig[task.priority].label}
                        </Badge>
                        
                        {task.isCompleted && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      
                      {/* Task title */}
                      <h3 className={cn(
                        "font-semibold mb-2 line-clamp-2 text-base",
                        task.isCompleted && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </h3>
                      
                      {/* Task description */}
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      {/* Task metadata */}
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-3 border-t">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(task.dueDate), "MM/dd", { locale: ko })}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
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
