import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useCreateSubtask, useUpdateSubtask, useDeleteSubtask } from "@/hooks/useSubtasks";
import { useCreateComment, useDeleteComment } from "@/hooks/useComments";
import { Plus, Trash2, Edit2, Calendar, Flag, MessageSquare, Check, X, ClipboardList } from "lucide-react";
import AddSubtaskFromTaskDialog from "./AddSubtaskFromTaskDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface TaskDetailDialogProps {
  taskId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TaskDetailDialog({ taskId, open, onOpenChange }: TaskDetailDialogProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState<number | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  const [addSubtaskFromTaskOpen, setAddSubtaskFromTaskOpen] = useState(false);

  const { data: taskDetail, isLoading } = useTask(taskId);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  
  if (isLoading || !taskDetail) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle className="sr-only">태스크 로딩 중</DialogTitle>
          <div className="text-center py-8">로딩 중...</div>
        </DialogContent>
      </Dialog>
    );
  }
  
  const task = taskDetail;
  const subtasks = task.subtasks || [];
  const comments = task.comments || [];
  const completedSubtasks = subtasks.filter((s: any) => s.isCompleted).length;
  const subtaskProgress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;
  
  const handleSaveEdit = () => {
    updateTask.mutate(
      { id: taskId, title: editTitle, description: editDescription },
      {
        onSuccess: () => {
          toast.success("태스크가 수정되었습니다");
          setIsEditing(false);
        },
      }
    );
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    createSubtask.mutate(
      { taskId: taskId, title: newSubtaskTitle.trim() },
      {
        onSuccess: () => {
          toast.success("서브태스크가 추가되었습니다");
          setNewSubtaskTitle("");
        },
      }
    );
  };

  const handleSaveSubtaskTitle = (subtaskId: number) => {
    if (!editingSubtaskTitle.trim()) return;
    updateSubtask.mutate(
      { id: subtaskId, taskId: taskId, title: editingSubtaskTitle.trim() },
      {
        onSuccess: () => {
          toast.success("서브태스크가 수정되었습니다");
          setEditingSubtaskId(null);
          setEditingSubtaskTitle("");
        },
      }
    );
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    createComment.mutate(
      { taskId: taskId, content: newComment.trim() },
      {
        onSuccess: () => {
          toast.success("댓글이 추가되었습니다");
          setNewComment("");
        },
      }
    );
  };

  const handleStatusChange = (status: string) => {
    updateTask.mutate(
      { id: taskId, status },
      {
        onSuccess: () => {
          toast.success("상태가 변경되었습니다");
        },
      }
    );
  };

  const handlePriorityChange = (priority: string) => {
    updateTask.mutate(
      { id: taskId, priority },
      {
        onSuccess: () => {
          toast.success("우선순위가 변경되었습니다");
        },
      }
    );
  };

  const priorityConfig = {
    high: { label: "높음", color: "bg-red-100 text-red-700" },
    medium: { label: "중간", color: "bg-yellow-100 text-yellow-700" },
    low: { label: "낮음", color: "bg-green-100 text-green-700" },
  };
  
  const statusConfig = {
    todo: { label: "대기", color: "bg-gray-100 text-gray-700" },
    in_progress: { label: "진행중", color: "bg-blue-100 text-blue-700" },
    done: { label: "완료", color: "bg-green-100 text-green-700" },
    hold: { label: "보류", color: "bg-orange-100 text-orange-700" },
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto nordic-scrollbar">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-2xl font-bold mb-2"
                />
              ) : (
                <DialogTitle className="text-3xl font-bold mb-2">{task.title}</DialogTitle>
              )}
              
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {/* Priority Select */}
                <Select value={task.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger className="w-[110px] h-8">
                    <div className="flex items-center gap-1.5">
                      <Flag className="w-3 h-3" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">
                      <span className="text-red-600">높음</span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="text-yellow-600">중간</span>
                    </SelectItem>
                    <SelectItem value="low">
                      <span className="text-green-600">낮음</span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Select */}
                <Select value={task.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[110px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">대기</SelectItem>
                    <SelectItem value="in_progress">진행중</SelectItem>
                    <SelectItem value="done">완료</SelectItem>
                    <SelectItem value="hold">보류</SelectItem>
                  </SelectContent>
                </Select>

                {/* Due Date */}
                {task.dueDate && (
                  <Badge variant="outline">
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(new Date(task.dueDate), "PPP", { locale: ko })}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Empty space - buttons moved to bottom */}
          </div>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          {/* Description */}
          <div>
            <Label className="text-lg font-semibold mb-2 block">설명</Label>
            {isEditing ? (
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
              />
            ) : (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {task.description || "설명이 없습니다"}
              </p>
            )}
          </div>
          
          <Separator />
          
          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-semibold">
                Subtasks ({completedSubtasks}/{subtasks.length})
              </Label>
              {subtasks.length > 0 && (
                <span className="text-sm text-muted-foreground">{subtaskProgress}%</span>
              )}
            </div>
            
            <div className="space-y-2 mb-4">
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-3 p-3 rounded-lg border group">
                  <Checkbox
                    checked={subtask.isCompleted}
                    onCheckedChange={(checked) => {
                      updateSubtask.mutate({
                        id: subtask.id,
                        taskId: taskId,
                        isCompleted: !!checked,
                      });
                    }}
                    className="shrink-0"
                  />

                  {editingSubtaskId === subtask.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editingSubtaskTitle}
                        onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveSubtaskTitle(subtask.id);
                          if (e.key === "Escape") {
                            setEditingSubtaskId(null);
                            setEditingSubtaskTitle("");
                          }
                        }}
                        autoFocus
                        className="flex-1 h-8"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSaveSubtaskTitle(subtask.id)}
                        className="h-8 w-8 p-0 shrink-0"
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingSubtaskId(null);
                          setEditingSubtaskTitle("");
                        }}
                        className="h-8 w-8 p-0 shrink-0"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span
                        className={`flex-1 cursor-pointer hover:text-primary ${subtask.isCompleted ? "line-through text-muted-foreground" : ""}`}
                        onClick={() => {
                          setEditingSubtaskId(subtask.id);
                          setEditingSubtaskTitle(subtask.title);
                        }}
                      >
                        {subtask.title}
                      </span>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingSubtaskId(subtask.id);
                            setEditingSubtaskTitle(subtask.title);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("서브태스크를 삭제하시겠습니까?")) {
                              deleteSubtask.mutate(
                                { id: subtask.id, taskId: taskId },
                                { onSuccess: () => toast.success("서브태스크가 삭제되었습니다") }
                              );
                            }
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">새 서브태스크 추가</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="서브태스크 제목 입력..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                />
                <Button onClick={handleAddSubtask} title="추가">
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAddSubtaskFromTaskOpen(true)}
                  title="기존 태스크에서 가져오기"
                >
                  <ClipboardList className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Comments */}
          <div>
            <Label className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              댓글 ({comments.length})
            </Label>
            
            <div className="space-y-4 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 rounded-lg bg-muted">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(comment.createdAt), "PPP p", { locale: ko })}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("댓글을 삭제하시겠습니까?")) {
                          deleteComment.mutate(
                            { id: comment.id },
                            { onSuccess: () => toast.success("댓글이 삭제되었습니다") }
                          );
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Textarea
                placeholder="댓글 작성..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddComment}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Action buttons at bottom */}
        <div className="pt-6 border-t mt-6">
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSaveEdit}>
                  저장
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  취소
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(true);
                    setEditTitle(task.title);
                    setEditDescription(task.description || "");
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  수정
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("정말 삭제하시겠습니까?")) {
                      deleteTask.mutate(
                        { id: taskId },
                        {
                          onSuccess: () => {
                            toast.success("태스크가 삭제되었습니다");
                            onOpenChange(false);
                          },
                        }
                      );
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  삭제
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>

      <AddSubtaskFromTaskDialog
        open={addSubtaskFromTaskOpen}
        onOpenChange={setAddSubtaskFromTaskOpen}
        taskId={taskId}
      />
    </Dialog>
  );
}
