import { useState } from "react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { useCategoryStats } from "@/hooks/useStats";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Tag, Trash2, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Categories() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2D5A7B");

  const { data: categories = [], isLoading } = useCategories();
  const { data: categoryStats = [] } = useCategoryStats();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("카테고리 이름을 입력해주세요");
      return;
    }
    createCategory.mutate(
      { name: name.trim(), color },
      {
        onSuccess: () => {
          toast.success("카테고리가 생성되었습니다");
          setCreateDialogOpen(false);
          setName("");
          setColor("#2D5A7B");
        },
      }
    );
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedCategory) return;
    updateCategory.mutate(
      { id: selectedCategory.id, name: name.trim(), color },
      {
        onSuccess: () => {
          toast.success("카테고리가 수정되었습니다");
          setEditDialogOpen(false);
          setSelectedCategory(null);
        },
      }
    );
  };

  const openEditDialog = (category: any) => {
    setSelectedCategory(category);
    setName(category.name);
    setColor(category.color);
    setEditDialogOpen(true);
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
            <h1 className="nordic-page-title">카테고리</h1>
            <p className="nordic-page-subtitle mt-1">태스크를 카테고리별로 분류하세요</p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="rounded-xl h-11 px-5 font-medium shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 카테고리
          </Button>
        </div>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full text-center py-16">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground mt-4 text-sm">로딩 중...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full nordic-card text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
              <Tag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">카테고리가 없습니다</h3>
            <p className="text-muted-foreground mb-6">
              카테고리를 만들어 태스크를 분류하세요
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              카테고리 추가
            </Button>
          </div>
        ) : (
          categories.map((category: any, index: number) => {
            const stats = categoryStats.find((s: any) => s.categoryId === category.id);
            return (
              <div
                key={category.id}
                className="nordic-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="nordic-card group border border-transparent hover:border-border/50">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: category.color + "15" }}
                    >
                      <Tag className="w-5 h-5" style={{ color: category.color }} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(category)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`"${category.name}" 카테고리를 삭제하시겠습니까?`)) {
                            deleteCategory.mutate(
                              { id: category.id },
                              { onSuccess: () => toast.success("카테고리가 삭제되었습니다") }
                            );
                          }
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mb-4">{category.name}</h3>

                  {stats && (
                    <div className="space-y-2 pt-3 border-t border-border/50">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">전체 태스크</span>
                        <span className="font-medium">{stats.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">완료</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{stats.completed}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">새 카테고리 만들기</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">카테고리 이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 업무, 개인, 학습"
                className="h-11 rounded-lg"
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
              <Button type="submit" disabled={createCategory.isPending} className="rounded-lg">
                {createCategory.isPending ? (
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">카테고리 수정</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">카테고리 이름</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-lg"
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
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-lg">
                취소
              </Button>
              <Button type="submit" disabled={updateCategory.isPending} className="rounded-lg">
                {updateCategory.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    수정 중...
                  </>
                ) : (
                  "수정"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
