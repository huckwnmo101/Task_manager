import { eq, and, or, like, desc, asc, inArray, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import {
  InsertUser, users,
  categories, InsertCategory, Category,
  projects, InsertProject, Project,
  projectMembers, InsertProjectMember, ProjectMember,
  tasks, InsertTask, Task,
  subtasks, InsertSubtask, Subtask,
  taskAssignees, InsertTaskAssignee,
  comments, InsertComment, Comment
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const sqlite = new Database("./data.db");
    _db = drizzle(sqlite);
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = getDb();

  try {
    const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);

    if (existing.length > 0) {
      // Update
      const updateSet: Record<string, unknown> = {};

      if (user.name !== undefined) updateSet.name = user.name;
      if (user.email !== undefined) updateSet.email = user.email;
      if (user.loginMethod !== undefined) updateSet.loginMethod = user.loginMethod;
      if (user.lastSignedIn !== undefined) updateSet.lastSignedIn = user.lastSignedIn;
      if (user.role !== undefined) updateSet.role = user.role;
      updateSet.updatedAt = new Date();

      if (Object.keys(updateSet).length > 0) {
        await db.update(users).set(updateSet).where(eq(users.openId, user.openId));
      }
    } else {
      // Insert
      await db.insert(users).values({
        openId: user.openId,
        name: user.name ?? null,
        email: user.email ?? null,
        password: user.password ?? null,
        loginMethod: user.loginMethod ?? null,
        role: user.role ?? "user",
        lastSignedIn: user.lastSignedIn ?? new Date(),
      });
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createLocalUser(data: {
  email: string;
  password: string;
  name: string;
}): Promise<InsertUser & { id: number }> {
  const db = getDb();

  const openId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  await db.insert(users).values({
    openId,
    email: data.email,
    password: data.password,
    name: data.name,
    loginMethod: "local",
    lastSignedIn: new Date(),
  });

  const [user] = await db.select().from(users).where(eq(users.openId, openId));
  return user as InsertUser & { id: number };
}

// Categories
export async function createCategory(data: InsertCategory): Promise<Category> {
  const db = getDb();

  await db.insert(categories).values(data);
  const [category] = await db.select().from(categories).where(eq(categories.userId, data.userId)).orderBy(desc(categories.id)).limit(1);
  return category!;
}

export async function getCategoriesByUserId(userId: number): Promise<Category[]> {
  const db = getDb();
  return db.select().from(categories).where(eq(categories.userId, userId)).orderBy(asc(categories.name));
}

export async function updateCategory(id: number, userId: number, data: Partial<InsertCategory>): Promise<Category | null> {
  const db = getDb();

  await db.update(categories).set({ ...data, updatedAt: new Date() }).where(and(eq(categories.id, id), eq(categories.userId, userId)));
  const [category] = await db.select().from(categories).where(eq(categories.id, id));
  return category || null;
}

export async function deleteCategory(id: number, userId: number): Promise<void> {
  const db = getDb();
  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
}

// Projects
export async function createProject(data: InsertProject): Promise<Project> {
  const db = getDb();

  await db.insert(projects).values(data);
  const [project] = await db.select().from(projects).where(eq(projects.userId, data.userId)).orderBy(desc(projects.id)).limit(1);
  return project!;
}

export async function getProjectsByUserId(userId: number): Promise<Project[]> {
  const db = getDb();
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number, userId: number): Promise<Project | null> {
  const db = getDb();
  const [project] = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
  return project || null;
}

export async function updateProject(id: number, userId: number, data: Partial<InsertProject>): Promise<Project | null> {
  const db = getDb();

  await db.update(projects).set({ ...data, updatedAt: new Date() }).where(and(eq(projects.id, id), eq(projects.userId, userId)));
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  return project || null;
}

export async function deleteProject(id: number, userId: number): Promise<void> {
  const db = getDb();
  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

// Tasks
export async function createTask(data: InsertTask): Promise<Task> {
  const db = getDb();

  await db.insert(tasks).values(data);
  const [task] = await db.select().from(tasks).where(eq(tasks.userId, data.userId)).orderBy(desc(tasks.id)).limit(1);
  return task!;
}

export async function getTasksByUserId(userId: number, filters?: {
  status?: string[];
  priority?: string[];
  categoryId?: number;
  projectId?: number;
  isToday?: boolean;
  search?: string;
  dueDateFrom?: number;
  dueDateTo?: number;
}): Promise<Task[]> {
  const db = getDb();

  const conditions = [eq(tasks.userId, userId)];

  if (filters?.status && filters.status.length > 0) {
    conditions.push(inArray(tasks.status, filters.status as any));
  }

  if (filters?.priority && filters.priority.length > 0) {
    conditions.push(inArray(tasks.priority, filters.priority as any));
  }

  if (filters?.categoryId) {
    conditions.push(eq(tasks.categoryId, filters.categoryId));
  }

  if (filters?.projectId) {
    conditions.push(eq(tasks.projectId, filters.projectId));
  }

  if (filters?.isToday !== undefined) {
    conditions.push(eq(tasks.isToday, filters.isToday));
  }

  if (filters?.search) {
    conditions.push(
      or(
        like(tasks.title, `%${filters.search}%`),
        like(tasks.description, `%${filters.search}%`)
      )!
    );
  }

  if (filters?.dueDateFrom) {
    conditions.push(gte(tasks.dueDate, filters.dueDateFrom));
  }

  if (filters?.dueDateTo) {
    conditions.push(lte(tasks.dueDate, filters.dueDateTo));
  }

  return db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt));
}

export async function getTaskById(id: number, userId: number): Promise<Task | null> {
  const db = getDb();
  const [task] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  return task || null;
}

export async function updateTask(id: number, userId: number, data: Partial<InsertTask>): Promise<Task | null> {
  const db = getDb();

  await db.update(tasks).set({ ...data, updatedAt: new Date() }).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  return task || null;
}

export async function deleteTask(id: number, userId: number): Promise<void> {
  const db = getDb();
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

// Subtasks
export async function createSubtask(data: InsertSubtask): Promise<Subtask> {
  const db = getDb();

  await db.insert(subtasks).values(data);
  const [subtask] = await db.select().from(subtasks).where(eq(subtasks.taskId, data.taskId)).orderBy(desc(subtasks.id)).limit(1);
  return subtask!;
}

export async function getSubtasksByTaskId(taskId: number): Promise<Subtask[]> {
  const db = getDb();
  return db.select().from(subtasks).where(eq(subtasks.taskId, taskId)).orderBy(asc(subtasks.order));
}

export async function updateSubtask(id: number, data: Partial<InsertSubtask>): Promise<Subtask | null> {
  const db = getDb();

  await db.update(subtasks).set({ ...data, updatedAt: new Date() }).where(eq(subtasks.id, id));
  const [subtask] = await db.select().from(subtasks).where(eq(subtasks.id, id));
  return subtask || null;
}

export async function deleteSubtask(id: number): Promise<void> {
  const db = getDb();
  await db.delete(subtasks).where(eq(subtasks.id, id));
}

// Comments
export async function createComment(data: InsertComment): Promise<Comment> {
  const db = getDb();

  await db.insert(comments).values(data);
  const [comment] = await db.select().from(comments).where(eq(comments.taskId, data.taskId)).orderBy(desc(comments.id)).limit(1);
  return comment!;
}

export async function getCommentsByTaskId(taskId: number): Promise<Comment[]> {
  const db = getDb();
  return db.select().from(comments).where(eq(comments.taskId, taskId)).orderBy(asc(comments.createdAt));
}

export async function updateComment(id: number, userId: number, content: string): Promise<Comment | null> {
  const db = getDb();

  await db.update(comments).set({ content, updatedAt: new Date() }).where(and(eq(comments.id, id), eq(comments.userId, userId)));
  const [comment] = await db.select().from(comments).where(eq(comments.id, id));
  return comment || null;
}

export async function deleteComment(id: number, userId: number): Promise<void> {
  const db = getDb();
  await db.delete(comments).where(and(eq(comments.id, id), eq(comments.userId, userId)));
}

// Project Members
export async function addProjectMember(data: InsertProjectMember): Promise<ProjectMember> {
  const db = getDb();

  await db.insert(projectMembers).values(data);
  const [member] = await db.select().from(projectMembers).where(eq(projectMembers.projectId, data.projectId)).orderBy(desc(projectMembers.id)).limit(1);
  return member!;
}

export async function getProjectMembers(projectId: number): Promise<ProjectMember[]> {
  const db = getDb();
  return db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));
}

export async function removeProjectMember(projectId: number, userId: number): Promise<void> {
  const db = getDb();
  await db.delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
}

// Task Assignees
export async function addTaskAssignee(data: InsertTaskAssignee): Promise<void> {
  const db = getDb();
  await db.insert(taskAssignees).values(data);
}

export async function getTaskAssignees(taskId: number): Promise<number[]> {
  const db = getDb();
  const assignees = await db.select().from(taskAssignees).where(eq(taskAssignees.taskId, taskId));
  return assignees.map(a => a.userId);
}

export async function removeTaskAssignee(taskId: number, userId: number): Promise<void> {
  const db = getDb();
  await db.delete(taskAssignees).where(and(eq(taskAssignees.taskId, taskId), eq(taskAssignees.userId, userId)));
}

// Statistics
export async function getTaskStats(userId: number, period: 'day' | 'week' | 'month'): Promise<{
  total: number;
  completed: number;
  completionRate: number;
}> {
  const db = getDb();

  const now = Date.now();
  let startTime = now;

  if (period === 'day') {
    startTime = now - 24 * 60 * 60 * 1000;
  } else if (period === 'week') {
    startTime = now - 7 * 24 * 60 * 60 * 1000;
  } else if (period === 'month') {
    startTime = now - 30 * 24 * 60 * 60 * 1000;
  }

  const allTasks = await db.select().from(tasks).where(
    and(
      eq(tasks.userId, userId),
      gte(tasks.createdAt, new Date(startTime))
    )
  );

  const completed = allTasks.filter(t => t.isCompleted).length;
  const total = allTasks.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, completionRate };
}

export async function getCategoryStats(userId: number): Promise<Array<{
  categoryId: number | null;
  categoryName: string;
  total: number;
  completed: number;
}>> {
  const db = getDb();

  const allTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));
  const allCategories = await getCategoriesByUserId(userId);

  const statsMap = new Map<number | null, { total: number; completed: number }>();

  allTasks.forEach(task => {
    const key = task.categoryId;
    const current = statsMap.get(key) || { total: 0, completed: 0 };
    current.total++;
    if (task.isCompleted) current.completed++;
    statsMap.set(key, current);
  });

  const result: Array<{
    categoryId: number | null;
    categoryName: string;
    total: number;
    completed: number;
  }> = [];

  statsMap.forEach((stats, categoryId) => {
    const category = allCategories.find(c => c.id === categoryId);
    result.push({
      categoryId,
      categoryName: category?.name || '미분류',
      total: stats.total,
      completed: stats.completed,
    });
  });

  return result;
}

// Initialize database tables
export async function initDb() {
  const db = getDb();

  // Create tables if not exists using raw SQL
  const sqlite = new Database("./data.db");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openId TEXT NOT NULL UNIQUE,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      loginMethod TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      lastSignedIn INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#3B82F6',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT NOT NULL DEFAULT '#8B5CF6',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projectMembers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      projectId INTEGER,
      categoryId INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      dueDate INTEGER,
      isCompleted INTEGER NOT NULL DEFAULT 0,
      isToday INTEGER NOT NULL DEFAULT 0,
      completedAt INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taskId INTEGER NOT NULL,
      title TEXT NOT NULL,
      isCompleted INTEGER NOT NULL DEFAULT 0,
      completedAt INTEGER,
      "order" INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS taskAssignees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taskId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taskId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      content TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);

  console.log("[Database] SQLite initialized");
}

// Auto-init on import
initDb();
