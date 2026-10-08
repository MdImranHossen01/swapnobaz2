"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  ChevronRight,
  LayoutDashboard,
  ShoppingBag,
  FileText,
  Image as ImageIcon,
  Settings,
  Wallet,
  Users,
  Rocket,
  LogOut,
} from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

const resellerNav = [
  {
    title: "Overview",
    icon: LayoutDashboard,
    items: [
      { title: "Dashboard", url: "/reseller/dashboard" },
    ],
  },
  {
    title: "Wallet & Payouts",
    icon: Wallet,
    items: [
      { title: "Wallet & Payouts", url: "/reseller/wallet" },
    ],
  },
  {
    title: "Product Management",
    icon: ShoppingBag,
    items: [
      { title: "My Store Products", url: "/reseller/products" },
      { title: "Add Personal Product", url: "/reseller/products/new" },
      { title: "Source B2B Products", url: "/reseller/products/source" },
      { title: "Upcoming Expire", url: "/reseller/upcoming-expiry" },
      { title: "Low Stock", url: "/reseller/low-stock" },
    ],
  },
  {
    title: "Sales & Orders",
    icon: FileText,
    items: [
      { title: "All Orders", url: "/reseller/orders" },
      { title: "Abandoned Carts", url: "/reseller/abandoned-carts" },
      { title: "Expenses & Incomes", url: "/reseller/expenses-incomes" },
      { title: "Accounts Ledger", url: "/reseller/ledger" },
    ],
  },
  {
    title: "User Management",
    icon: Users,
    items: [
      { title: "All Customers", url: "/reseller/users" },
    ],
  },
  {
    title: "CMS Manager",
    icon: ImageIcon,
    items: [
      { title: "Hero Banners", url: "/reseller/cms/banners" },
    ],
  },
  {
    title: "System Settings",
    icon: Settings,
    items: [
      { title: "Coupons", url: "/reseller/coupons" },
      { title: "Store Settings", url: "/reseller/settings" },
      { title: "Marketing & Tracking", url: "/reseller/marketing" },
    ],
  },
]

function buildNav(basePath?: string) {
  if (!basePath) return resellerNav;
  return resellerNav.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      url: item.url.replace('/reseller', basePath),
    })),
  }));
}

function NavMain({ items, pathname }: { items: typeof resellerNav; pathname: string }) {
  const { setOpenMobile, isMobile } = useSidebar()

  const handleLinkClick = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <SidebarGroup className="py-2">
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const isParentActive = item.items.some(
            (sub) =>
              pathname === sub.url ||
              (sub.url !== "#" && pathname.startsWith(sub.url + "/"))
          )

          return (
            <Collapsible
              key={item.title}
              defaultOpen={isParentActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger
                  render={
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isParentActive}
                      className={`h-10 rounded-xl px-3 transition-all duration-200 ${
                        isParentActive
                          ? "!bg-primary !text-white font-bold shadow-md shadow-primary/30 data-active:!bg-primary data-active:!text-white data-[active=true]:!bg-primary data-[active=true]:!text-white"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    />
                  }
                >
                  {item.icon && <item.icon className={`h-5 w-5 shrink-0 ${isParentActive ? "!text-white" : "text-slate-300"}`} />}
                  <span className={`text-sm font-medium tracking-tight ml-1.5 ${isParentActive ? "!text-white font-bold" : "text-slate-200"}`}>
                    {item.title}
                  </span>
                  <ChevronRight className={`ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 ${isParentActive ? "!text-white opacity-90" : "text-slate-400 opacity-70"}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="ml-4 pl-2 border-l border-slate-800/80 my-1 space-y-1">
                    {item.items.map((sub) => {
                      const isSubActive =
                        pathname === sub.url ||
                        (sub.url !== "#" &&
                          pathname.startsWith(sub.url + "/") &&
                          !item.items.some(
                            (other) =>
                              other !== sub &&
                              other.url.length > sub.url.length &&
                              pathname.startsWith(other.url)
                          ))

                      return (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton
                            render={<Link href={sub.url} onClick={handleLinkClick} />}
                            isActive={isSubActive}
                            className={`h-8 rounded-lg px-3 text-xs transition-all duration-150 ${
                              isSubActive
                                ? "!bg-primary !text-white font-bold shadow-sm data-active:!bg-primary data-active:!text-white"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                            }`}
                          >
                            <span className={isSubActive ? "!text-white font-bold" : ""}>{sub.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function ResellerAppSidebar({ basePath, ...props }: React.ComponentProps<typeof Sidebar> & { basePath?: string }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user
  const navItems = buildNav(basePath)

  return (
    <Sidebar {...props} className="border-r border-slate-800/80 bg-[#0a152e] text-slate-100">
      <SidebarHeader className="border-b border-slate-800/80 h-16 px-4 flex items-center justify-between bg-[#0a152e]">
        <Logo textClassName="text-base font-black tracking-wide text-white whitespace-nowrap" />
      </SidebarHeader>

      <SidebarContent className="gap-0 bg-[#0a152e] scrollbar-thin scrollbar-thumb-slate-800">
        <NavMain items={navItems} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-800/80 p-3 bg-[#081024]">
        {/* User Profile Mini Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-8 w-8 border border-slate-700">
              <AvatarImage src={user?.image || ""} alt={user?.name || "Reseller"} />
              <AvatarFallback className="bg-primary text-white font-bold text-xs">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "RS"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">{user?.name || "Reseller Partner"}</p>
              <p className="text-[10px] text-emerald-400 font-medium">Verified Reseller</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
