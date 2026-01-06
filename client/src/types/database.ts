export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: number;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          name: string;
          color: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          color?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: number;
          user_id: string;
          name: string;
          description: string | null;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          name: string;
          description?: string | null;
          color: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          color?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: number;
          user_id: string;
          project_id: number | null;
          category_id: number | null;
          title: string;
          description: string | null;
          status: 'todo' | 'in_progress' | 'done' | 'hold';
          priority: 'low' | 'medium' | 'high';
          due_date: number | null;
          is_completed: boolean;
          is_today: boolean;
          completed_at: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          project_id?: number | null;
          category_id?: number | null;
          title: string;
          description?: string | null;
          status?: 'todo' | 'in_progress' | 'done' | 'hold';
          priority?: 'low' | 'medium' | 'high';
          due_date?: number | null;
          is_completed?: boolean;
          is_today?: boolean;
          completed_at?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: number | null;
          category_id?: number | null;
          title?: string;
          description?: string | null;
          status?: 'todo' | 'in_progress' | 'done' | 'hold';
          priority?: 'low' | 'medium' | 'high';
          due_date?: number | null;
          is_completed?: boolean;
          is_today?: boolean;
          completed_at?: number | null;
          updated_at?: string;
        };
      };
      subtasks: {
        Row: {
          id: number;
          task_id: number;
          title: string;
          is_completed: boolean;
          is_today: boolean;
          completed_at: number | null;
          order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          task_id: number;
          title: string;
          is_completed?: boolean;
          is_today?: boolean;
          completed_at?: number | null;
          order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          is_completed?: boolean;
          is_today?: boolean;
          completed_at?: number | null;
          order?: number;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: number;
          task_id: number;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          task_id: number;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          updated_at?: string;
        };
      };
    };
  };
};

// Raw Supabase types (snake_case)
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type ProjectRow = Database['public']['Tables']['projects']['Row'];
export type TaskRow = Database['public']['Tables']['tasks']['Row'];
export type SubtaskRow = Database['public']['Tables']['subtasks']['Row'];
export type CommentRow = Database['public']['Tables']['comments']['Row'];

// Transformed types (camelCase) - used by components
export type Profile = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: number;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: number;
  userId: string;
  projectId: number | null;
  categoryId: number | null;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done' | 'hold';
  priority: 'low' | 'medium' | 'high';
  dueDate: number | null;
  isCompleted: boolean;
  isToday: boolean;
  completedAt: number | null;
  createdAt: string;
  updatedAt: string;
  category?: Category | null;
  project?: Project | null;
  subtaskTotal?: number;
  subtaskCompleted?: number;
};

export type Subtask = {
  id: number;
  taskId: number;
  title: string;
  isCompleted: boolean;
  isToday: boolean;
  completedAt: number | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  task?: Task;
};

export type Comment = {
  id: number;
  taskId: number;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

// Extended types with relations
export type TaskWithRelations = Task & {
  subtasks?: Subtask[];
  comments?: Comment[];
};
