import { useState } from "react";
import { useOverviewStats, useCategoryStats } from "@/hooks/useStats";
import { useTasks } from "@/hooks/useTasks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, CheckCircle2, Clock, AlertCircle, BarChart3 } from "lucide-react";

export default function Statistics() {
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");

  const { data: overview } = useOverviewStats(period);
  const { data: categoryStats = [] } = useCategoryStats();
  const { data: tasks = [] } = useTasks({});

  // Prepare data for charts
  const categoryChartData = categoryStats.map((stat: any) => ({
    name: stat.categoryName,
    completed: stat.completed,
    total: stat.total,
    pending: stat.total - stat.completed,
  }));

  const priorityData = [
    { name: "높음", value: tasks.filter((t: any) => t.priority === "high").length, color: "#DC4A4A" },
    { name: "중간", value: tasks.filter((t: any) => t.priority === "medium").length, color: "#F59E0B" },
    { name: "낮음", value: tasks.filter((t: any) => t.priority === "low").length, color: "#10B981" },
  ];

  const statusData = [
    { name: "대기", value: tasks.filter((t: any) => t.status === "todo").length, color: "#94A3B8" },
    { name: "진행중", value: tasks.filter((t: any) => t.status === "in_progress").length, color: "#3B82F6" },
    { name: "완료", value: tasks.filter((t: any) => t.status === "done").length, color: "#10B981" },
    { name: "보류", value: tasks.filter((t: any) => t.status === "hold").length, color: "#F59E0B" },
  ];

  const periodLabels: Record<string, string> = {
    day: "오늘",
    week: "이번 주",
    month: "이번 달",
  };

  return (
    <div className="space-y-8 w-full mx-auto">
      {/* Header */}
      <div className="nordic-page-header">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="nordic-page-title">통계</h1>
            <p className="nordic-page-subtitle mt-1">작업 현황을 한눈에 파악하세요</p>
          </div>
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[140px] h-10 rounded-lg border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">오늘</SelectItem>
              <SelectItem value="week">이번 주</SelectItem>
              <SelectItem value="month">이번 달</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 nordic-stagger">
          <div className="nordic-stat-card nordic-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">{periodLabels[period]}</span>
            </div>
            <p className="text-3xl font-bold">{overview.total}</p>
            <p className="text-sm text-muted-foreground mt-1">전체 태스크</p>
          </div>

          <div className="nordic-stat-card nordic-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs text-muted-foreground">{periodLabels[period]}</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{overview.completed}</p>
            <p className="text-sm text-muted-foreground mt-1">완료한 태스크</p>
          </div>

          <div className="nordic-stat-card nordic-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs text-muted-foreground">{periodLabels[period]}</span>
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{overview.completionRate}%</p>
            <p className="text-sm text-muted-foreground mt-1">완료율</p>
          </div>

          <div className="nordic-stat-card nordic-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs text-muted-foreground">{periodLabels[period]}</span>
            </div>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {overview.total - overview.completed}
            </p>
            <p className="text-sm text-muted-foreground mt-1">진행중</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category chart */}
        <div className="nordic-card nordic-slide-up">
          <h3 className="text-lg font-semibold mb-6">카테고리별 완료 현황</h3>
          {categoryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="completed" fill="#10B981" name="완료" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="#94A3B8" name="미완료" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              데이터가 없습니다
            </div>
          )}
        </div>

        {/* Priority chart */}
        <div className="nordic-card nordic-slide-up">
          <h3 className="text-lg font-semibold mb-6">우선순위별 분포</h3>
          {priorityData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              데이터가 없습니다
            </div>
          )}
        </div>

        {/* Status chart */}
        <div className="nordic-card nordic-slide-up">
          <h3 className="text-lg font-semibold mb-6">상태별 분포</h3>
          {statusData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              데이터가 없습니다
            </div>
          )}
        </div>

        {/* Category stats table */}
        <div className="nordic-card nordic-slide-up">
          <h3 className="text-lg font-semibold mb-6">카테고리 상세</h3>
          <div className="space-y-5">
            {categoryStats.length > 0 ? (
              categoryStats.map((stat: any) => {
                const completionRate = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
                return (
                  <div key={stat.categoryId || "uncategorized"} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{stat.categoryName}</span>
                      <span className="text-sm text-muted-foreground">
                        {stat.completed} / {stat.total}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-secondary mx-auto mb-3 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">데이터가 없습니다</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
