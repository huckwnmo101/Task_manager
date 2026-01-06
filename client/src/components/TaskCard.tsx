import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Flag, FolderOpen, Clock } from "lucide-react";
import { useToggleTaskComplete } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/database";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const toggleComplete = useToggleTaskComplete();

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleComplete.mutate({ id: task.id, isCompleted: !task.isCompleted });
  };

  const priorityConfig = {
    high: {
      label: "높음",
      className: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
    },
    medium: {
      label: "중간",
      className: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
    },
    low: {
      label: "낮음",
      className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
    },
  };

  const statusConfig = {
    todo: {
      label: "대기",
      className: "bg-secondary text-secondary-foreground"
    },
    in_progress: {
      label: "진행중",
      className: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
    },
    done: {
      label: "완료",
      className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
    },
    hold: {
      label: "보류",
      className: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
    },
  };

  const isOverdue = task.dueDate && task.dueDate < Date.now() && !task.isCompleted;
  const isDueSoon = task.dueDate && task.dueDate > Date.now() && task.dueDate < Date.now() + 24 * 60 * 60 * 1000;

  return (
    <div
      onClick={onClick}
      className={cn(
        "nordic-card group cursor-pointer",
        "border border-transparent hover:border-border/50",
        task.isCompleted && "opacity-60"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <div
          onClick={handleCheckboxChange}
          className="pt-0.5 shrink-0"
        >
          <Checkbox
            checked={task.isCompleted}
            className={cn(
              "h-5 w-5 rounded-md border-2 transition-all",
              task.isCompleted
                ? "border-primary bg-primary data-[state=checked]:bg-primary"
                : "border-border hover:border-primary/50"
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className={cn(
              "text-base font-medium leading-snug",
              task.isCompleted && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h3>

            {/* Priority indicator */}
            <div className={cn(
              "shrink-0 w-2 h-2 rounded-full mt-2",
              task.priority === "high" && "bg-red-500",
              task.priority === "medium" && "bg-amber-500",
              task.priority === "low" && "bg-emerald-500"
            )} />
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Badge */}
            <span className={cn(
              "nordic-badge text-xs",
              priorityConfig[task.priority].className
            )}>
              <Flag className="w-3 h-3" />
              {priorityConfig[task.priority].label}
            </span>

            {/* Status Badge */}
            {task.status !== "todo" && (
              <span className={cn(
                "nordic-badge text-xs",
                statusConfig[task.status].className
              )}>
                {statusConfig[task.status].label}
              </span>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <span className={cn(
                "nordic-badge text-xs",
                isOverdue
                  ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  : isDueSoon
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                    : "bg-secondary text-secondary-foreground"
              )}>
                {isOverdue ? (
                  <Clock className="w-3 h-3" />
                ) : (
                  <Calendar className="w-3 h-3" />
                )}
                {new Date(task.dueDate).toLocaleDateString('ko-KR', {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            )}

            {/* Project indicator */}
            {task.projectId && (
              <span className="nordic-badge text-xs bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                <FolderOpen className="w-3 h-3" />
                프로젝트
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
