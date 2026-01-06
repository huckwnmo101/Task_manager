import { useState } from "react";
import { useProjects, useCreateProject, useDeleteProject, useProjectStats } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, FolderOpen, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";

export default function Projects() {
  const [, setLocation] = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#2D5A7B");

  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("프로젝트 이름을 입력해주세요");
      return;
    }
    createProject.mutate(
      { name: name.trim(), description: description.trim() || undefined, color },
      {
        onSuccess: () => {
          toast.success("프로젝트가 생성되었습니다");
          setCreateDialogOpen(false);
          setName("");
          setDescription("");
          setColor("#2D5A7B");
        },
      }
    );
  };

  const colorOptions = [
    "#2D5A7B", "#7B9E87", "#88B4C4", "#9B8AA3", "#C4A574", "#DC4A4A", "#3B82F6", "#14B8A6",
    "#8B5CF6", "#EC4899", "#F97316", "#84CC16", "#06B6D4", "#6366F1", "#EF4444", "#78716C"
  ];

  return (
    <div className="space-y-8 w-full mx-auto">
      {/* Header */}
      <div className="nordic-page-header">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="nordic-page-title">프로젝트</h1>
            <p className="nordic-page-subtitle mt-1">태스크를 프로젝트별로 관리하세요</p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="rounded-xl h-11 px-5 font-medium shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 프로젝트
          </Button>
        </div>
      </div>

      {/* Project grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full text-center py-16">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground mt-4 text-sm">로딩 중...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full nordic-card text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">프로젝트가 없습니다</h3>
            <p className="text-muted-foreground mb-6">
              새 프로젝트를 만들어 태스크를 체계적으로 관리하세요
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              프로젝트 추가
            </Button>
          </div>
        ) : (
          projects.map((project: any, index: number) => (
            <div
              key={project.id}
              className="nordic-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ProjectCard
                project={project}
                onDelete={() => {
                  if (confirm(`"${project.name}" 프로젝트를 삭제하시겠습니까?`)) {
                    deleteProject.mutate(
                      { id: project.id },
                      { onSuccess: () => toast.success("프로젝트가 삭제되었습니다") }
                    );
                  }
                }}
                onClick={() => setLocation(`/projects/${project.id}`)}
              />
            </div>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">새 프로젝트 만들기</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">프로젝트 이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="프로젝트 이름을 입력하세요"
                className="h-11 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">설명 (선택)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="프로젝트 설명을 입력하세요"
                rows={3}
                className="rounded-lg resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">색상</Label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-9 h-9 rounded-lg transition-all hover:scale-110"
                    style={{
                      backgroundColor: c,
                      boxShadow: color === c ? `0 0 0 2px var(--background), 0 0 0 4px ${c}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} className="rounded-lg">
                취소
              </Button>
              <Button type="submit" disabled={createProject.isPending} className="rounded-lg">
                {createProject.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  "생성"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectCard({ project, onDelete, onClick }: {
  project: any;
  onDelete: () => void;
  onClick: () => void;
}) {
  const { data: stats } = useProjectStats(project.id);

  return (
    <div
      className="nordic-card cursor-pointer group border border-transparent hover:border-border/50"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: project.color + "15" }}
        >
          <FolderOpen className="w-5 h-5" style={{ color: project.color }} />
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
        >
          <Trash2 className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>

      <h3 className="text-lg font-semibold mb-1">{project.name}</h3>
      {project.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {stats && (
        <div className="space-y-3 pt-3 border-t border-border/50">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">진행률</span>
            <span className="font-medium">{stats.completionRate}%</span>
          </div>
          <Progress value={stats.completionRate} className="h-1.5" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{stats.completed} 완료</span>
            <span>{stats.total} 전체</span>
          </div>
        </div>
      )}
    </div>
  );
}
