import { Home, Package, Truck, Container, Users, Settings, ShoppingCart, Ship, Archive, FileText, Boxes, Building2, UserCheck, Trash2 } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Commandes", url: "/orders", icon: ShoppingCart },
  { title: "Produits", url: "/products", icon: Package },
  { title: "Fournisseurs", url: "/suppliers", icon: Building2 },
  { title: "Clients", url: "/clients", icon: UserCheck },
  { title: "Expéditions", url: "/shipments", icon: Ship },
  { title: "Conteneurs", url: "/containers", icon: Container },
  { title: "Groupage", url: "/groupage", icon: Boxes },
  { title: "Rapports", url: "/reports", icon: FileText },
  { title: "Utilisateurs", url: "/users", icon: Users },
  { title: "Corbeille", url: "/trash", icon: Trash2 },
  { title: "Paramètres", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";
  
  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };
  
  const getNavClasses = (path: string) => {
    return isActive(path) 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50";
  };

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b">
          <h2 className={`font-bold text-lg ${isCollapsed ? "hidden" : "block"}`}>
            Procurement App
          </h2>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "hidden" : "block"}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClasses(item.url)}
                      end={item.url === "/"}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}