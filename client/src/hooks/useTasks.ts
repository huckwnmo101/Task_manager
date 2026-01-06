import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { Task, TaskWithRelations, Category, Project, Subtask, Comment } from '@/types/database';

interface TaskFilters {
  status?: string;
  priority?: string;
  categoryId?: number;
  projectId?: number;
  isToday?: boolean;
  search?: string;
}

export function useTasks(filters: TaskFilters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('tasks')
        .select(`
          *,
          category:categories(*),
          project:projects(*)
        `)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters.isToday) {
        query = query.eq('is_today', true);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform to match existing interface
      return (data || []).map((task: any) => ({
        id: task.id,
        userId: task.user_id,
        projectId: task.project_id,
        categoryId: task.category_id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        isCompleted: task.is_completed,
        isToday: task.is_today,
        completedAt: task.completed_at,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        category: task.category,
        project: task.project,
      }));
    },
    enabled: !!user,
  });
}

export function useTask(taskId: number | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      if (!user || !taskId) return null;

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          category:categories(*),
          project:projects(*),
          subtasks(*),
          comments(*)
        `)
        .eq('id', taskId)
        .single();

      if (error) throw error;

      // Transform to match existing interface
      return {
        id: data.id,
        userId: data.user_id,
        projectId: data.project_id,
        categoryId: data.category_id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.due_date,
        isCompleted: data.is_completed,
        isToday: data.is_today,
        completedAt: data.completed_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        category: data.category,
        project: data.project,
        subtasks: (data.subtasks || []).map((s: any) => ({
          id: s.id,
          taskId: s.task_id,
          title: s.title,
          isCompleted: s.is_completed,
          completedAt: s.completed_at,
          order: s.order,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        })),
        comments: (data.comments || []).map((c: any) => ({
          id: c.id,
          taskId: c.task_id,
          userId: c.user_id,
          content: c.content,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        })),
      };
    },
    enabled: !!user && !!taskId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      categoryId?: number;
      projectId?: number;
      dueDate?: number;
      isToday?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description,
          status: input.status || 'todo',
          priority: input.priority || 'medium',
          category_id: input.categoryId,
          project_id: input.projectId,
          due_date: input.dueDate,
          is_today: input.isToday || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['categoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: number;
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      categoryId?: number | null;
      projectId?: number | null;
      dueDate?: number | null;
      isToday?: boolean;
      isCompleted?: boolean;
    }) => {
      const updateData: any = { updated_at: new Date().toISOString() };

      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.categoryId !== undefined) updateData.category_id = input.categoryId;
      if (input.projectId !== undefined) updateData.project_id = input.projectId;
      if (input.dueDate !== undefined) updateData.due_date = input.dueDate;
      if (input.isToday !== undefined) updateData.is_today = input.isToday;
      if (input.isCompleted !== undefined) {
        updateData.is_completed = input.isCompleted;
        updateData.completed_at = input.isCompleted ? Date.now() : null;
        if (input.isCompleted) {
          updateData.status = 'done';
        }
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['categoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['categoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
    },
  });
}

export function useToggleTaskComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isCompleted }: { id: number; isCompleted: boolean }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? Date.now() : null,
          status: isCompleted ? 'done' : 'todo',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['categoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
    },
  });
}
