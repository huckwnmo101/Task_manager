import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
    mutationFn: async ({ id, title, isCompleted }: { id: number; title?: string; isCompleted?: boolean }) => {
      const updateData: any = { updated_at: new Date().toISOString() };

      if (title !== undefined) updateData.title = title;
      if (isCompleted !== undefined) {
        updateData.is_completed = isCompleted;
        updateData.completed_at = isCompleted ? Date.now() : null;
      }

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
