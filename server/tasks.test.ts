import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("tasks router", () => {
  it("should create a task", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const task = await caller.tasks.create({
      title: "Test Task",
      description: "Test Description",
      priority: "high",
      status: "todo",
    });

    expect(task).toBeDefined();
    expect(task.title).toBe("Test Task");
    expect(task.description).toBe("Test Description");
    expect(task.priority).toBe("high");
    expect(task.status).toBe("todo");
    expect(task.userId).toBe(1);
  });

  it("should list tasks", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const tasks = await caller.tasks.list({});

    expect(Array.isArray(tasks)).toBe(true);
  });

  it("should filter tasks by status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create tasks with different statuses
    await caller.tasks.create({
      title: "Todo Task",
      status: "todo",
    });
    
    await caller.tasks.create({
      title: "In Progress Task",
      status: "in_progress",
    });

    const todoTasks = await caller.tasks.list({ status: ["todo"] });
    const inProgressTasks = await caller.tasks.list({ status: ["in_progress"] });

    expect(todoTasks.every(t => t.status === "todo")).toBe(true);
    expect(inProgressTasks.every(t => t.status === "in_progress")).toBe(true);
  });

  it("should toggle task completion", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const task = await caller.tasks.create({
      title: "Task to Complete",
      status: "todo",
    });

    expect(task.isCompleted).toBe(false);

    const completedTask = await caller.tasks.toggleComplete({ id: task.id });

    expect(completedTask?.isCompleted).toBe(true);
    expect(completedTask?.status).toBe("done");
    expect(completedTask?.completedAt).toBeDefined();
  });
});

describe("categories router", () => {
  it("should create a category", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const category = await caller.categories.create({
      name: "Work",
      color: "#3B82F6",
    });

    expect(category).toBeDefined();
    expect(category.name).toBe("Work");
    expect(category.color).toBe("#3B82F6");
    expect(category.userId).toBe(1);
  });

  it("should list categories", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const categories = await caller.categories.list();

    expect(Array.isArray(categories)).toBe(true);
  });
});

describe("projects router", () => {
  it("should create a project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const project = await caller.projects.create({
      name: "Test Project",
      description: "Project Description",
      color: "#8B5CF6",
    });

    expect(project).toBeDefined();
    expect(project.name).toBe("Test Project");
    expect(project.description).toBe("Project Description");
    expect(project.userId).toBe(1);
  });

  it("should calculate project stats", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const project = await caller.projects.create({
      name: "Stats Project",
    });

    await caller.tasks.create({
      title: "Task 1",
      projectId: project.id,
      status: "done",
      isCompleted: true,
    });

    await caller.tasks.create({
      title: "Task 2",
      projectId: project.id,
      status: "todo",
      isCompleted: false,
    });

    const stats = await caller.projects.stats({ projectId: project.id });

    expect(stats.total).toBe(2);
    expect(stats.completionRate).toBeGreaterThanOrEqual(0);
    expect(stats.completionRate).toBeLessThanOrEqual(100);
  });
});

describe("subtasks router", () => {
  it("should create a subtask", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const task = await caller.tasks.create({
      title: "Parent Task",
    });

    const subtask = await caller.subtasks.create({
      taskId: task.id,
      title: "Subtask 1",
      order: 0,
    });

    expect(subtask).toBeDefined();
    expect(subtask.title).toBe("Subtask 1");
    expect(subtask.taskId).toBe(task.id);
    expect(subtask.isCompleted).toBe(false);
  });

  it("should auto-complete parent task when all subtasks are completed", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const task = await caller.tasks.create({
      title: "Parent Task",
    });

    const subtask1 = await caller.subtasks.create({
      taskId: task.id,
      title: "Subtask 1",
      order: 0,
    });

    const subtask2 = await caller.subtasks.create({
      taskId: task.id,
      title: "Subtask 2",
      order: 1,
    });

    // Complete first subtask
    await caller.subtasks.update({
      id: subtask1.id,
      taskId: task.id,
      isCompleted: true,
    });

    let parentTask = await caller.tasks.get({ id: task.id });
    expect(parentTask?.isCompleted).toBe(false);

    // Complete second subtask
    await caller.subtasks.update({
      id: subtask2.id,
      taskId: task.id,
      isCompleted: true,
    });

    parentTask = await caller.tasks.get({ id: task.id });
    expect(parentTask?.isCompleted).toBe(true);
  }, 10000);
});

describe("comments router", () => {
  it("should create a comment", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const task = await caller.tasks.create({
      title: "Task with Comments",
    });

    const comment = await caller.comments.create({
      taskId: task.id,
      content: "This is a comment",
    });

    expect(comment).toBeDefined();
    expect(comment.content).toBe("This is a comment");
    expect(comment.taskId).toBe(task.id);
    expect(comment.userId).toBe(1);
  });
});

describe("stats router", () => {
  it("should calculate overview stats", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.tasks.create({
      title: "Completed Task",
      isCompleted: true,
    });

    await caller.tasks.create({
      title: "Incomplete Task",
      isCompleted: false,
    });

    const stats = await caller.stats.overview({ period: "week" });

    expect(stats.total).toBeGreaterThanOrEqual(2);
    expect(stats.completed).toBeGreaterThanOrEqual(1);
    expect(stats.completionRate).toBeGreaterThanOrEqual(0);
  });

  it("should calculate category stats", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const category = await caller.categories.create({
      name: "Test Category",
      color: "#3B82F6",
    });

    await caller.tasks.create({
      title: "Task in Category",
      categoryId: category.id,
      status: "done",
      isCompleted: true,
    });

    const stats = await caller.stats.byCategory();

    const categoryStats = stats.find(s => s.categoryId === category.id);
    expect(categoryStats).toBeDefined();
    expect(categoryStats?.total).toBeGreaterThanOrEqual(1);
  });
});
