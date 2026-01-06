import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTasks } from "@/hooks/useTasks";
import { useCreateSubtask } from "@/hooks/useSubtasks";
import { Search, Calendar, FolderOpen, Flag, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddSubtaskFromTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: number;
}

export default function AddSubtaskFromTaskDialog({
  open,
  onOpenChange,
  taskId
}: AddSubtaskFromTaskDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: allTasks = [] } = useTasks({});
  const createSubtask = useCreateSubtask();

  // Filter tasks (exclude current task and completed tasks)
  const availableTasks = useMemo(() => {
    return allTasks.filter((task: any) => {
      // Exclude current task
      if (task.id === taskId) return false;
      // Exclude completed tasks
      if (task.isCompleted) return false;
      // Apply search filter
      if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [allTasks, search, taskId]);

  // Group by project
  const groupedTasks = useMemo(() => {
    const groups: Record<string, typeof availableTasks> = {
      "프로젝트 없음": [],
    };

    availableTasks.forEach((task: any) => {
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
  }, [availableTasks]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAddAsSubtasks = async () => {
    if (selectedIds.length === 0) {
      toast.error("태스크를 선택해주세요");
      return;
    }

    try {
      const selectedTasks = allTasks.filter((t: any) => selectedIds.includes(t.id));

      await Promise.all(
        selectedTasks.map((task: any) =>
          createSubtask.mutateAsync({ taskId, title: task.title })
        )
      );

      toast.success(`${selectedIds.length}개의 서브태스크가 추가되었습니다`);
      setSelectedIds([]);
      setSearch("");
      onOpenChange(false);
    } catch (error) {
      toast.error("서브태스크 추가 실패");
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
          <DialogTitle className="text-2xl font-bold">기존 태스크에서 서브태스크 추가</DialogTitle>
          <p className="text-muted-foreground text-sm">
            기존 태스크를 서브태스크로 추가합니다 (태스크 제목이 서브태스크로 복사됩니다)
          </p>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="태스크 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Task List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {Object.keys(groupedTasks).length === 0 ? (
            <div className="text-center py-12">
              <ListTodo className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? "검색 결과가 없습니다" : "추가할 수 있는 태스크가 없습니다"}
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {Object.entries(groupedTasks).map(([projectName, tasks]) => (
                <div key={projectName}>
                  <div className="flex items-center gap-2 mb-3">
                    <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm text-muted-foreground">{projectName}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {tasks.length}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {tasks.map((task: any) => (
                      <div
                        key={task.id}
                        onClick={() => toggleSelect(task.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                          selectedIds.includes(task.id)
                            ? "border-primary bg-primary/5"
                            : "hover:border-border hover:bg-muted/50"
                        )}
                      >
                        <Checkbox
                          checked={selectedIds.includes(task.id)}
                          onCheckedChange={() => toggleSelect(task.id)}
                          className="shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={cn("text-xs", priorityConfig[task.priority as keyof typeof priorityConfig].color)}>
                            <Flag className="w-3 h-3 mr-1" />
                            {priorityConfig[task.priority as keyof typeof priorityConfig].label}
                          </Badge>

                          {task.dueDate && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(task.dueDate).toLocaleDateString("ko-KR", {
                                month: "short",
                                day: "numeric",
                              })}
                            </Badge>
                          )}
                        </div>
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
            <Button onClick={handleAddAsSubtasks} disabled={selectedIds.length === 0}>
              서브태스크로 추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
