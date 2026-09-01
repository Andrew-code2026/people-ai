import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { Bell, Bot, Building2, FileText, LayoutDashboard, LogOut, PanelLeft, Settings2, UserPlus, Users, WalletCards } from "lucide-react";
import type { RoleKey } from "../../../drizzle/schema";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "@/lib/utils";

const menuItemsByRole: Record<RoleKey, Array<{ icon: typeof LayoutDashboard; label: string; path: string }>> = {
  SUPER_ADMIN: [{ icon: LayoutDashboard, label: "Resumen", path: "/platform" }, { icon: Building2, label: "Empresas", path: "/platform" }, { icon: Users, label: "Usuarios", path: "/platform" }],
  COMPANY_ADMIN: [{ icon: LayoutDashboard, label: "Resumen", path: "/company" }, { icon: Building2, label: "Empresa", path: "/company" }, { icon: Users, label: "Usuarios", path: "/company" }],
  HR: [{ icon: LayoutDashboard, label: "Inicio", path: "/hr" }, { icon: UserPlus, label: "Contrataciones", path: "/hr/contrataciones" }, { icon: FileText, label: "Cargos y plantillas", path: "/hr/positions" }, { icon: Bot, label: "HR Assistant", path: "/hr/assistant" }, { icon: FileText, label: "Base de conocimiento", path: "/hr/knowledge" }, { icon: Bell, label: "Notificaciones", path: "/hr/notifications" }, { icon: Settings2, label: "Configuración", path: "/hr/settings" }],
  FINANCE: [{ icon: LayoutDashboard, label: "Dashboard", path: "/finance" }, { icon: WalletCards, label: "Costos", path: "/finance" }, { icon: FileText, label: "Reportes", path: "/finance" }],
  MANAGER: [{ icon: LayoutDashboard, label: "Dashboard", path: "/manager" }, { icon: Users, label: "Mi equipo", path: "/manager" }, { icon: FileText, label: "Solicitudes", path: "/manager" }],
  EMPLOYEE: [{ icon: LayoutDashboard, label: "Inicio", path: "/employee" }, { icon: Users, label: "Mi perfil", path: "/employee" }, { icon: FileText, label: "Mis solicitudes", path: "/employee" }],
};

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
  roleOverride,
}: {
  children: React.ReactNode;
  roleOverride?: RoleKey;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const utils = trpc.useUtils();
  const devLogin = trpc.auth.devLogin.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      await utils.access.me.invalidate();
    },
  });

  const handleLogin = async () => {
    try {
      await devLogin.mutateAsync();
    } catch {
      startLogin();
    }
  };

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Building2 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              PEOPLE AI
            </h1>
            <p className="text-sm text-slate-500">
              Inicia sesión para acceder al centro de gestión de Talento Humano.
            </p>
          </div>
          <Button
            onClick={handleLogin}
            disabled={devLogin.isPending}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md transition-all py-6 rounded-xl"
          >
            {devLogin.isPending ? "Iniciando sesión..." : "Iniciar sesión (Alexa Torres · HR)"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth} roleOverride={roleOverride}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  roleOverride?: RoleKey;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  roleOverride,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const role = roleOverride ?? ((user?.role === "admin" ? "SUPER_ADMIN" : "COMPANY_ADMIN") as RoleKey);
  const menuItems = menuItemsByRole[role];
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center p-2 group-data-[collapsible=icon]:p-2">
            <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleSidebar}
                    className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 cursor-pointer text-muted-foreground group-data-[collapsible=icon]:mx-auto"
                    aria-label={isCollapsed ? "Expandir barra lateral" : "Ocultar barra lateral"}
                  >
                    <PanelLeft className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" hidden={!isCollapsed}>
                  Expandir barra lateral
                </TooltipContent>
              </Tooltip>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                  <span className="font-semibold tracking-tight truncate">
                    PEOPLE AI
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={cn(
                        "h-10 transition-colors duration-150 font-normal cursor-pointer rounded-lg",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        "group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center",
                        isActive
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover/menu-item:text-sidebar-accent-foreground"
                        )}
                      />
                      <span className="truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-2 group-data-[collapsible=icon]:p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full text-left group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:mx-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                  aria-label="Perfil de usuario"
                >
                  <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-muted text-foreground">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-foreground">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
