import { z } from "zod";
import bcrypt from "bcryptjs";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { sdk } from "./_core/sdk";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    register: publicProcedure
      .input(z.object({
        email: z.string().email("유효한 이메일을 입력하세요"),
        password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
        name: z.string().min(1, "이름을 입력하세요"),
      }))
      .mutation(async ({ ctx, input }) => {
        // 이메일 중복 체크
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "이미 사용 중인 이메일입니다",
          });
        }

        // 비밀번호 해시
        const hashedPassword = await bcrypt.hash(input.password, 10);

        // 사용자 생성
        const user = await db.createLocalUser({
          email: input.email,
          password: hashedPassword,
          name: input.name,
        });

        // 세션 토큰 생성
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        // 쿠키 설정
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email("유효한 이메일을 입력하세요"),
        password: z.string().min(1, "비밀번호를 입력하세요"),
      }))
      .mutation(async ({ ctx, input }) => {
        // 사용자 조회
        const user = await db.getUserByEmail(input.email);
        if (!user || !user.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "이메일 또는 비밀번호가 올바르지 않습니다",
          });
        }

        // 비밀번호 확인
        const isValidPassword = await bcrypt.compare(input.password, user.password);
        if (!isValidPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "이메일 또는 비밀번호가 올바르지 않습니다",
          });
        }

        // 마지막 로그인 시간 업데이트
        await db.upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
        });

        // 세션 토큰 생성
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        // 쿠키 설정
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Categories
  categories: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getCategoriesByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        color: z.string().default("#3B82F6"),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createCategory({
          userId: ctx.user.id,
          name: input.name,
          color: input.color,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateCategory(id, ctx.user.id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCategory(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Projects
  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getProjectsByUserId(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getProjectById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        color: z.string().default("#8B5CF6"),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createProject({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          color: input.color,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateProject(id, ctx.user.id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteProject(input.id, ctx.user.id);
        return { success: true };
      }),
    
    stats: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const tasks = await db.getTasksByUserId(ctx.user.id, { projectId: input.projectId });
        const total = tasks.length;
        const completed = tasks.filter(t => t.isCompleted).length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return { total, completed, completionRate };
      }),
  }),

  // Tasks
  tasks: router({
    list: protectedProcedure
      .input(z.object({
        status: z.array(z.enum(["todo", "in_progress", "done", "hold"])).optional(),
        priority: z.array(z.enum(["low", "medium", "high"])).optional(),
        categoryId: z.number().optional(),
        projectId: z.number().optional(),
        isToday: z.boolean().optional(),
        search: z.string().optional(),
        dueDateFrom: z.number().optional(),
        dueDateTo: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getTasksByUserId(ctx.user.id, input);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const task = await db.getTaskById(input.id, ctx.user.id);
        if (!task) return null;
        
        const subtasks = await db.getSubtasksByTaskId(input.id);
        const comments = await db.getCommentsByTaskId(input.id);
        const assignees = await db.getTaskAssignees(input.id);
        
        return { ...task, subtasks, comments, assignees };
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(500),
        description: z.string().optional(),
        status: z.enum(["todo", "in_progress", "done", "hold"]).default("todo"),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        dueDate: z.number().optional(),
        isToday: z.boolean().default(false),
        projectId: z.number().optional(),
        categoryId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createTask({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          dueDate: input.dueDate,
          isToday: input.isToday,
          projectId: input.projectId,
          categoryId: input.categoryId,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().optional(),
        status: z.enum(["todo", "in_progress", "done", "hold"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.number().optional(),
        isToday: z.boolean().optional(),
        isCompleted: z.boolean().optional(),
        projectId: z.number().optional(),
        categoryId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        
        // Auto-set completedAt when marking as completed
        if (data.isCompleted === true) {
          (data as any).completedAt = Date.now();
        } else if (data.isCompleted === false) {
          (data as any).completedAt = null;
        }
        
        return db.updateTask(id, ctx.user.id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTask(input.id, ctx.user.id);
        return { success: true };
      }),
    
    toggleComplete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const task = await db.getTaskById(input.id, ctx.user.id);
        if (!task) throw new Error("Task not found");
        
        const isCompleted = !task.isCompleted;
        return db.updateTask(input.id, ctx.user.id, {
          isCompleted,
          completedAt: isCompleted ? Date.now() : undefined,
          status: isCompleted ? "done" : "todo",
        });
      }),
  }),

  // Subtasks
  subtasks: router({
    create: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        title: z.string().min(1).max(500),
        order: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify task ownership
        const task = await db.getTaskById(input.taskId, ctx.user.id);
        if (!task) throw new Error("Task not found");
        
        return db.createSubtask({
          taskId: input.taskId,
          title: input.title,
          order: input.order,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        taskId: z.number(),
        title: z.string().min(1).max(500).optional(),
        isCompleted: z.boolean().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify task ownership
        const task = await db.getTaskById(input.taskId, ctx.user.id);
        if (!task) throw new Error("Task not found");
        
        const { id, taskId, ...data } = input;
        
        if (data.isCompleted === true) {
          (data as any).completedAt = Date.now();
        } else if (data.isCompleted === false) {
          (data as any).completedAt = null;
        }
        
        const subtask = await db.updateSubtask(id, data);
        
        // Check if all subtasks are completed
        const allSubtasks = await db.getSubtasksByTaskId(taskId);
        const allCompleted = allSubtasks.every(s => s.isCompleted);
        
        if (allCompleted && allSubtasks.length > 0) {
          await db.updateTask(taskId, ctx.user.id, {
            isCompleted: true,
            completedAt: Date.now(),
            status: "done",
          });
        }
        
        return subtask;
      }),
    
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
        taskId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify task ownership
        const task = await db.getTaskById(input.taskId, ctx.user.id);
        if (!task) throw new Error("Task not found");
        
        await db.deleteSubtask(input.id);
        return { success: true };
      }),
  }),

  // Comments
  comments: router({
    create: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify task ownership
        const task = await db.getTaskById(input.taskId, ctx.user.id);
        if (!task) throw new Error("Task not found");
        
        return db.createComment({
          taskId: input.taskId,
          userId: ctx.user.id,
          content: input.content,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.updateComment(input.id, ctx.user.id, input.content);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteComment(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Statistics
  stats: router({
    overview: protectedProcedure
      .input(z.object({
        period: z.enum(["day", "week", "month"]).default("week"),
      }))
      .query(async ({ ctx, input }) => {
        return db.getTaskStats(ctx.user.id, input.period);
      }),
    
    byCategory: protectedProcedure.query(async ({ ctx }) => {
      return db.getCategoryStats(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
