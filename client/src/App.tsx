import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Today from "./pages/Today";
import AllTasks from "./pages/AllTasks";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Categories from "./pages/Categories";
import KanbanBoard from "./pages/KanbanBoard";
import CalendarView from "./pages/CalendarView";
import Statistics from "./pages/Statistics";
import Login from "./pages/Login";
import { useAuth } from "./hooks/useAuth";

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground mt-4 text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function Router() {
  const { user, loading } = useAuth();

  // If on login page and already logged in, redirect to home
  if (!loading && user && window.location.pathname === "/login") {
    return <Redirect to="/" />;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute>
          <DashboardLayout><Today /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/tasks">
        <ProtectedRoute>
          <DashboardLayout><AllTasks /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/projects">
        <ProtectedRoute>
          <DashboardLayout><Projects /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/projects/:id">
        <ProtectedRoute>
          <DashboardLayout><ProjectDetail /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/categories">
        <ProtectedRoute>
          <DashboardLayout><Categories /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/kanban">
        <ProtectedRoute>
          <DashboardLayout><KanbanBoard /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/calendar">
        <ProtectedRoute>
          <DashboardLayout><CalendarView /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/statistics">
        <ProtectedRoute>
          <DashboardLayout><Statistics /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="apple" defaultMode="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
