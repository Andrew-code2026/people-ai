import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import RoleDashboard from "@/pages/RoleDashboard";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/platform"><RoleDashboard expectedRole="SUPER_ADMIN" /></Route>
    <Route path="/company"><RoleDashboard expectedRole="COMPANY_ADMIN" /></Route>
    <Route path="/hr"><RoleDashboard expectedRole="HR" /></Route>
    <Route path="/finance"><RoleDashboard expectedRole="FINANCE" /></Route>
    <Route path="/manager"><RoleDashboard expectedRole="MANAGER" /></Route>
    <Route path="/employee"><RoleDashboard expectedRole="EMPLOYEE" /></Route>
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
