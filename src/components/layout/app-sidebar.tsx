import { Calendar, Inbox, BarChart, Settings, Users, Key, LayoutGrid, Sparkles, Plus, Layers, MessageSquare, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"

const mainNavItems = [
  { title: "Posts", url: "/posts", icon: Layers },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Queue", url: "/queue", icon: LayoutGrid },
  { title: "Accounts", url: "/accounts", icon: Users },
  { title: "Engagement", url: "/engagement", icon: BarChart },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Analytics", url: "/analytics", icon: BarChart },
]

const workspaceItems = [
  { title: "Overview", url: "/workspace", icon: LayoutGrid },
  { title: "Members", url: "/workspace/members", icon: Users },
  { title: "API keys", url: "/workspace/api-keys", icon: Key },
]

const instanceItems = [
  { title: "General", url: "/settings/general", icon: Settings },
  { title: "Polling", url: "/settings/polling", icon: LayoutGrid },
  { title: "Platforms", url: "/settings/platforms", icon: Briefcase },
]

export function AppSidebar() {
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 font-bold text-lg px-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="truncate">One2O</span>
        </div>
        <div className="mt-4">
           <Button className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
             <Plus className="w-4 h-4 shrink-0" />
             <span className="truncate">Compose post</span>
           </Button>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase text-muted-foreground mt-4 mb-2">Publishing</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase text-muted-foreground mt-4 mb-2">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase text-muted-foreground mt-4 mb-2">Instance settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {instanceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
            A
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">Admin User</span>
            <span className="text-xs text-muted-foreground truncate">Admin</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
