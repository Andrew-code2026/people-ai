import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import HRDashboard from "@/pages/HRDashboard";
import HRSection from "@/pages/HRSection";
import PositionsPage from "@/pages/PositionsPage";
import HiringPage from "@/pages/HiringPage";
import HiringDetailPage from "@/pages/HiringDetailPage";
import CandidatePortalPage from "@/pages/CandidatePortalPage";
import NotificationsPage from "@/pages/NotificationsPage";
import RoleDashboard from "@/pages/RoleDashboard";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return <Switch>
    <Route path="/"><HRDashboard /></Route>
    <Route path="/demo"><Home /></Route>
    <Route path="/platform"><RoleDashboard expectedRole="SUPER_ADMIN" /></Route>
    <Route path="/company"><RoleDashboard expectedRole="COMPANY_ADMIN" /></Route>
    <Route path="/hr"><HRDashboard /></Route>
    <Route path="/hr/positions"><PositionsPage /></Route>
    <Route path="/hr/contrataciones"><HiringPage /></Route>
    <Route path="/hr/contrataciones/:id"><HiringDetailPage /></Route>
    <Route path="/hr/notifications"><NotificationsPage /></Route>
    <Route path="/candidate/documents/:token"><CandidatePortalPage /></Route>
    <Route path="/hr/contratacion"><HRSection section="contratacion" /></Route>
    <Route path="/hr/assistant"><HRSection section="assistant" /></Route>
    <Route path="/hr/knowledge"><HRSection section="knowledge" /></Route>
    <Route path="/hr/notifications"><HRSection section="notifications" /></Route>
    <Route path="/hr/settings"><HRSection section="settings" /></Route>
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
