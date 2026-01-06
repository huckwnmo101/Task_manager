import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Subtask } from '@/types/database';

// Transform snake_case to camelCase
function transformSubtask(row: any): Subtask & { task?: any } {
  return {
    id: row.id,
    taskId: row.task_id,
    title: row.title,
    isCompleted: row.is_completed,
    isToday: row.is_today,
    completedAt: row.completed_at,
    order: row.order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    task: row.task ? {
      id: row.task.id,
      title: row.task.title,
      priority: row.task.priority,
      status: row.task.status,
      project: row.task.project,
    } : undefined,
  };
}

// Get all subtasks marked as today
export function useTodaySubtasks() {
  return useQuery({
    queryKey: ['subtasks', 'today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subtasks')
        .select(`
          *,
          task:tasks(id, title, priority, status, project:projects(*))
        `)
        .eq('is_today', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(transformSubtask);
    },
  });
}

export function useCreateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, title }: { taskId: number; title: string }) => {
      // Get current max order
      const { data: existing } = await supabase
        .from('subtasks')
        .select('order')
        .eq('task_id', taskId)
        .order('order', { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 ? existing[0].order + 1 : 0;

      const { data, error } = await supabase
        .from('subtasks')
        .insert({ task_id: taskId, title, order: nextOrder })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
    },
  });
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, isCompleted, isToday }: { id: number; title?: string; isCompleted?: boolean; isToday?: boolean }) => {
      const updateData: any = { updated_at: new Date().toISOString() };

      if (title !== undefined) updateData.title = title;
      if (isCompleted !== undefined) {
        updateData.is_completed = isCompleted;
        updateData.completed_at = isCompleted ? Date.now() : null;
      }
      if (isToday !== undefined) updateData.is_today = isToday;

      const { data, error } = await supabase
        .from('subtasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['subtasks', 'today'] });
    },
  });
}

export function useToggleSubtaskToday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isToday }: { id: number; isToday: boolean }) => {
      const { data, error } = await supabase
        .from('subtasks')
        .update({ is_today: isToday, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['subtasks', 'today'] });
    },
  });
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
    },
  });
}
