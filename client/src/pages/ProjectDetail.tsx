import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useProject, useProjectStats } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import TaskCard from "@/components/TaskCard";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import TaskDetailDialog from "@/components/TaskDetailDialog";
import { Progress } from "@/components/ui/progress";

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const [, setLocation] = useLocation();
  const projectId = params?.id ? parseInt(params.id) : 0;
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: tasks = [], isLoading: tasksLoading } = useTasks({ projectId });
  const { data: stats } = useProjectStats(projectId);
  
  if (projectLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">프로젝트를 찾을 수 없습니다</h2>
        <Button onClick={() => setLocation("/projects")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          프로젝트 목록으로
        </Button>
      </div>
    );
  }
  
  const statusGroups = {
    todo: tasks.filter(t => t.status === "todo"),
    in_progress: tasks.filter(t => t.status === "in_progress"),
    done: tasks.filter(t => t.status === "done"),
    hold: tasks.filter(t => t.status === "hold"),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <Button
          variant="ghost"
          onClick={() => setLocation("/projects")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          프로젝트 목록
        </Button>
        
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: project.color + "20" }}
            >
              <div className="text-3xl" style={{ color: project.color }}>📁</div>
            </div>
            <div>
              <h1 className="text-5xl font-bold tracking-tight mb-2">{project.name}</h1>
              {project.description && (
                <p className="subtitle text-lg">{project.description}</p>
              )}
            </div>
          </div>
          <Button 
            size="lg" 
            onClick={() => setCreateDialogOpen(true)}
            className="rounded-full shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            태스크 추가
          </Button>
        </div>
        
        {/* Progress */}
        {stats && (
          <div className="mt-8 nordic-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">프로젝트 진행률</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.completed} / {stats.total} 태스크 완료
                </p>
              </div>
              <div className="text-3xl font-bold">{stats.completionRate}%</div>
            </div>
            <Progress value={stats.completionRate} className="h-3" />
          </div>
        )}
      </div>

      {/* Task sections by status */}
      <div className="space-y-8">
        {Object.entries(statusGroups).map(([status, statusTasks]) => {
          const statusLabels = {
            todo: "대기",
            in_progress: "진행중",
            done: "완료",
            hold: "보류",
          };
          
          if (statusTasks.length === 0) return null;
          
          return (
            <div key={status}>
              <h2 className="text-2xl font-bold mb-4">
                {statusLabels[status as keyof typeof statusLabels]} ({statusTasks.length})
              </h2>
              <div className="space-y-3">
                {statusTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTaskId(task.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
        
        {tasks.length === 0 && !tasksLoading && (
          <div className="text-center py-12 nordic-card">
            <h3 className="text-xl font-semibold mb-2">태스크가 없습니다</h3>
            <p className="text-muted-foreground mb-6">이 프로젝트에 첫 태스크를 추가하세요</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              태스크 추가
            </Button>
          </div>
        )}
      </div>

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultProjectId={projectId}
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
