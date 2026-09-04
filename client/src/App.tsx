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
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import AcceptInvitePage from "@/pages/AcceptInvitePage";
import CompanyUsersPage from "@/pages/CompanyUsersPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return <Switch>
    {/* Publicas */}
    <Route path="/login"><LoginPage /></Route>
    <Route path="/signup"><SignUpPage /></Route>
    {/* La invitacion se autoriza por el token de la URL, no por sesion. */}
    <Route path="/invitacion/:token"><AcceptInvitePage /></Route>
    {/* El portal del candidato se autoriza por el token de la URL, no por sesion. */}
    <Route path="/candidate/documents/:token"><CandidatePortalPage /></Route>
    <Route path="/demo"><Home /></Route>

    {/* Requieren sesion */}
    <Route path="/"><ProtectedRoute><HRDashboard /></ProtectedRoute></Route>
    <Route path="/platform"><ProtectedRoute><RoleDashboard expectedRole="SUPER_ADMIN" /></ProtectedRoute></Route>
    <Route path="/company"><ProtectedRoute><RoleDashboard expectedRole="COMPANY_ADMIN" /></ProtectedRoute></Route>
    <Route path="/company/usuarios"><ProtectedRoute><CompanyUsersPage /></ProtectedRoute></Route>
    <Route path="/hr"><ProtectedRoute><HRDashboard /></ProtectedRoute></Route>
    <Route path="/hr/positions"><ProtectedRoute><PositionsPage /></ProtectedRoute></Route>
    <Route path="/hr/contrataciones"><ProtectedRoute><HiringPage /></ProtectedRoute></Route>
    <Route path="/hr/contrataciones/:id"><ProtectedRoute><HiringDetailPage /></ProtectedRoute></Route>
    <Route path="/hr/notifications"><ProtectedRoute><NotificationsPage /></ProtectedRoute></Route>
    <Route path="/hr/contratacion"><ProtectedRoute><HRSection section="contratacion" /></ProtectedRoute></Route>
    <Route path="/hr/assistant"><ProtectedRoute><HRSection section="assistant" /></ProtectedRoute></Route>
    <Route path="/hr/knowledge"><ProtectedRoute><HRSection section="knowledge" /></ProtectedRoute></Route>
    <Route path="/hr/settings"><ProtectedRoute><HRSection section="settings" /></ProtectedRoute></Route>
    <Route path="/finance"><ProtectedRoute><RoleDashboard expectedRole="FINANCE" /></ProtectedRoute></Route>
    <Route path="/manager"><ProtectedRoute><RoleDashboard expectedRole="MANAGER" /></ProtectedRoute></Route>
    <Route path="/employee"><ProtectedRoute><RoleDashboard expectedRole="EMPLOYEE" /></ProtectedRoute></Route>

    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
