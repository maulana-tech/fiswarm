import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Simulation from "./pages/Simulation";
import SimulationDetail from "./pages/SimulationDetail";
import Reports from "./pages/Reports";
import ReportDetail from "./pages/ReportDetail";
import Home from "./pages/Home";
import QuickDemo from "./pages/QuickDemo";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard">
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      <Route path="/transactions">
        <DashboardLayout>
          <Transactions />
        </DashboardLayout>
      </Route>
      <Route path="/simulation">
        <DashboardLayout>
          <Simulation />
        </DashboardLayout>
      </Route>
      <Route path="/simulation/:id">
        {(params) => (
          <DashboardLayout>
            <SimulationDetail id={Number(params.id)} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/reports">
        <DashboardLayout>
          <Reports />
        </DashboardLayout>
      </Route>
      <Route path="/reports/:id">
        {(params) => (
          <DashboardLayout>
            <ReportDetail id={Number(params.id)} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/demo" component={QuickDemo} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
