import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useOverviewStats(period: 'day' | 'week' | 'month' = 'week') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stats', 'overview', period],
    queryFn: async () => {
      if (!user) return null;

      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          const dayOfWeek = now.getDay();
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('is_completed, created_at')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const total = tasks?.length || 0;
      const completed = tasks?.filter(t => t.is_completed).length || 0;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { total, completed, completionRate };
    },
    enabled: !!user,
  });
}

export function useCategoryStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['categoryStats'],
    queryFn: async () => {
      if (!user) return [];

      // Get all categories
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name');

      if (catError) throw catError;

      // Get all tasks
      const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .select('category_id, is_completed');

      if (taskError) throw taskError;

      // Calculate stats for each category
      const stats = (categories || []).map(category => {
        const categoryTasks = tasks?.filter(t => t.category_id === category.id) || [];
        const total = categoryTasks.length;
        const completed = categoryTasks.filter(t => t.is_completed).length;

        return {
          categoryId: category.id,
          categoryName: category.name,
          total,
          completed,
        };
      });

      // Add uncategorized tasks
      const uncategorizedTasks = tasks?.filter(t => !t.category_id) || [];
      if (uncategorizedTasks.length > 0) {
        stats.push({
          categoryId: null as any,
          categoryName: '미분류',
          total: uncategorizedTasks.length,
          completed: uncategorizedTasks.filter(t => t.is_completed).length,
        });
      }

      return stats;
    },
    enabled: !!user,
  });
}
