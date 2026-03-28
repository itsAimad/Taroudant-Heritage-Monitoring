import {
  LayoutDashboard,
  Landmark,
  Activity,
  ClipboardCheck,
  AlertTriangle,
  FileText,
  Users,
  LogOut,
  Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const adminItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Monuments", url: "/monuments", icon: Landmark },
  { title: "Séismes", url: "/seismes", icon: Activity },
  { title: "Inspections", url: "/inspections", icon: ClipboardCheck },
  { title: "Alertes", url: "/alerts", icon: AlertTriangle },
  { title: "Rapports", url: "/reports", icon: FileText },
  { title: "Utilisateurs", url: "/users", icon: Users },
];

const expertItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Monuments", url: "/monuments", icon: Landmark },
  { title: "Séismes", url: "/seismes", icon: Activity },
  { title: "Inspections", url: "/inspections", icon: ClipboardCheck },
  { title: "Rapports", url: "/reports", icon: FileText },
];

const authorityItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Monuments", url: "/monuments", icon: Landmark },
  { title: "Séismes", url: "/seismes", icon: Activity },
  { title: "Inspections", url: "/inspections", icon: ClipboardCheck },
  { title: "Alertes", url: "/alerts", icon: AlertTriangle },
  { title: "Rapports", url: "/reports", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const items = user?.role === "Expert" ? expertItems : user?.role === "Authority" ? authorityItems : adminItems;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 px-4 py-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-sidebar-primary" />
              {!collapsed && <span className="font-display text-sm text-sidebar-primary">Heritage Shield</span>}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className="text-sidebar-foreground hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                  >
                    <NavLink to={item.url} end activeClassName="bg-sidebar-accent">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-sidebar border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="px-4 py-2">
            <p className="text-xs text-sidebar-foreground/60">{user.role}</p>
            <p className="text-sm text-sidebar-foreground truncate">{user.name}</p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
              className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Déconnexion</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
