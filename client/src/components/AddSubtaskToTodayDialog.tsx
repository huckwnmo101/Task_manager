import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTasks } from "@/hooks/useTasks";
import { useToggleSubtaskToday } from "@/hooks/useSubtasks";
import { Search, FolderOpen, Flag, ListTodo, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddSubtaskToTodayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddSubtaskToTodayDialog({
  open,
  onOpenChange,
}: AddSubtaskToTodayDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

  const { data: allTasks = [] } = useTasks({});
  const toggleSubtaskToday = useToggleSubtaskToday();

  // Filter tasks that have subtasks
  const tasksWithSubtasks = useMemo(() => {
    return allTasks.filter((task: any) => {
      if (task.isCompleted) return false;
      if (!task.subtasks || task.subtasks.length === 0) return false;
      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase();
        const taskMatches = task.title.toLowerCase().includes(searchLower);
        const subtaskMatches = task.subtasks.some((s: any) =>
          s.title.toLowerCase().includes(searchLower)
        );
        if (!taskMatches && !subtaskMatches) return false;
      }
      return true;
    });
  }, [allTasks, search]);

  // Group by project
  const groupedTasks = useMemo(() => {
    const groups: Record<string, typeof tasksWithSubtasks> = {
      "프로젝트 없음": [],
    };

    tasksWithSubtasks.forEach((task: any) => {
      const projectName = task.project?.name || "프로젝트 없음";
      if (!groups[projectName]) {
        groups[projectName] = [];
      }
      groups[projectName].push(task);
    });

    // Remove empty groups
    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) delete groups[key];
    });

    return groups;
  }, [tasksWithSubtasks]);

  const toggleExpand = (taskId: number) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleSelect = (subtaskId: number) => {
    setSelectedIds((prev) =>
      prev.includes(subtaskId)
        ? prev.filter((i) => i !== subtaskId)
        : [...prev, subtaskId]
    );
  };

  const handleAddToToday = async () => {
    if (selectedIds.length === 0) {
      toast.error("서브태스크를 선택해주세요");
      return;
    }

    try {
      await Promise.all(
        selectedIds.map((id) =>
          toggleSubtaskToday.mutateAsync({ id, isToday: true })
        )
      );

      toast.success(`${selectedIds.length}개의 서브태스크가 오늘의 할 일에 추가되었습니다`);
      setSelectedIds([]);
      setSearch("");
      onOpenChange(false);
    } catch (error) {
      toast.error("추가 실패");
    }
  };

  const priorityConfig = {
    high: { label: "높음", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    medium: { label: "중간", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    low: { label: "낮음", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">서브태스크를 오늘의 할 일에 추가</DialogTitle>
          <p className="text-muted-foreground text-sm">
            기존 태스크의 서브태스크를 선택하여 오늘의 할 일에 추가합니다
          </p>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="태스크 또는 서브태스크 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Task/Subtask List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {Object.keys(groupedTasks).length === 0 ? (
            <div className="text-center py-12">
              <ListTodo className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? "검색 결과가 없습니다" : "서브태스크가 있는 태스크가 없습니다"}
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {Object.entries(groupedTasks).map(([projectName, tasks]) => (
                <div key={projectName}>
                  <div className="flex items-center gap-2 mb-3">
                    <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm text-muted-foreground">{projectName}</h3>
                  </div>

                  <div className="space-y-2">
                    {tasks.map((task: any) => (
                      <div key={task.id} className="border rounded-lg overflow-hidden">
                        {/* Task Header */}
                        <div
                          onClick={() => toggleExpand(task.id)}
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          {expandedTasks.has(task.id) ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {task.subtasks?.length || 0}개의 서브태스크
                            </p>
                          </div>

                          <Badge className={cn("text-xs shrink-0", priorityConfig[task.priority as keyof typeof priorityConfig].color)}>
                            <Flag className="w-3 h-3 mr-1" />
                            {priorityConfig[task.priority as keyof typeof priorityConfig].label}
                          </Badge>
                        </div>

                        {/* Subtasks */}
                        {expandedTasks.has(task.id) && task.subtasks && (
                          <div className="border-t bg-muted/30">
                            {task.subtasks
                              .filter((s: any) => !s.isCompleted && !s.isToday)
                              .map((subtask: any) => (
                                <div
                                  key={subtask.id}
                                  onClick={() => toggleSelect(subtask.id)}
                                  className={cn(
                                    "flex items-center gap-3 p-3 pl-10 cursor-pointer transition-all border-b last:border-b-0",
                                    selectedIds.includes(subtask.id)
                                      ? "bg-primary/10"
                                      : "hover:bg-muted/50"
                                  )}
                                >
                                  <Checkbox
                                    checked={selectedIds.includes(subtask.id)}
                                    onCheckedChange={() => toggleSelect(subtask.id)}
                                    className="shrink-0"
                                  />
                                  <span className="flex-1 text-sm">{subtask.title}</span>
                                </div>
                              ))}
                            {task.subtasks.filter((s: any) => !s.isCompleted && !s.isToday).length === 0 && (
                              <p className="text-sm text-muted-foreground p-3 pl-10">
                                추가할 수 있는 서브태스크가 없습니다
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t -mx-6 px-6 -mb-2">
          <span className="text-sm text-muted-foreground">
            {selectedIds.length}개 선택됨
          </span>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button onClick={handleAddToToday} disabled={selectedIds.length === 0}>
              오늘의 할 일에 추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
