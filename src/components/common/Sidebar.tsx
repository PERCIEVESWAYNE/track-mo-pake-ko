
import {
  LayoutDashboard,
  ReceiptText,
  Wallet,
  ChartNoAxesCombined,
  Archive,
  BookOpen,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  UserRound,
  Users,
  Tags,
  ClipboardList,
} from "lucide-react";

type UserRole = "admin" | "user";

const userNavigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Budgets", icon: Wallet },
  { name: "Expenses", icon: ReceiptText },
  { name: "Reports", icon: ChartNoAxesCombined },
  { name: "Archive", icon: Archive },
  { name: "Financial Literacy", icon: BookOpen },
  { name: "Settings", icon: Settings },
];

const adminNavigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "User Management", icon: Users },
  { name: "Category Management", icon: Tags },
  { name: "Reports and Analytics", icon: ChartNoAxesCombined },
  { name: "Audit Logs", icon: ClipboardList },
];

type SidebarProps = {
  activePage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  onSignOut: () => void;
  userEmail: string;
  role?: UserRole;
};

function Sidebar({
  activePage,
  onNavigate,
  collapsed,
  onToggle,
  onSignOut,
  userEmail,
  role = "user",
}: SidebarProps) {
  // Display navigation based on the authenticated user's role.
  const navigation =
    role === "admin" ? adminNavigation : userNavigation;

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shrink-0 z-40 overflow-y-auto`}
    >
      {/* Logo and Toggle */}
      <div
        className={`${
          collapsed ? "px-2 py-5" : "p-5"
        } border-b border-gray-100 shrink-0`}
      >
        <div
          className={`flex items-center ${
            collapsed ? "flex-col gap-4" : "justify-between"
          }`}
        >
          {collapsed ? (
            <h1 className="text-xl font-bold text-green-700 text-center">
              TM
            </h1>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-green-700">
                Track Mo,
              </h1>
              <p className="text-sm text-gray-500">Pake ko!</p>
            </div>
          )}

          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-green-700 transition"
          >
            {collapsed ? (
              <PanelLeftOpen size={20} />
            ) : (
              <PanelLeftClose size={20} />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className={`${
          collapsed ? "px-2" : "p-4"
        } py-4 space-y-2 flex-1`}
      >
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.name;

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onNavigate(item.name)}
              title={collapsed ? item.name : undefined}
              aria-label={item.name}
              aria-current={isActive ? "page" : undefined}
              className={`w-full flex items-center ${
                collapsed ? "justify-center px-2" : "gap-3 px-4"
              } py-3 rounded-xl text-sm font-medium transition ${
                isActive
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={20} className="shrink-0" />

              {!collapsed && <span>{item.name}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Account and Sign Out */}
      <div
        className={`${
          collapsed ? "px-2 py-3" : "p-3"
        } border-t border-gray-100 shrink-0`}
      >
        {/* User Account */}
        <div
          className={`mb-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3 ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? userEmail : undefined}
        >
          <div className="rounded-full bg-green-100 p-2 text-green-700 shrink-0">
            <UserRound size={18} />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800">
                {role === "admin" ? "Administrator" : "My Account"}
              </p>

              <p className="truncate text-xs text-gray-500">
                {userEmail}
              </p>
            </div>
          )}
        </div>

        {/* Sign Out */}
        <button
          type="button"
          onClick={onSignOut}
          title={collapsed ? "Sign Out" : undefined}
          aria-label="Sign Out"
          className={`w-full flex items-center ${
            collapsed ? "justify-center px-2" : "gap-3 px-4"
          } py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition`}
        >
          <LogOut size={20} className="shrink-0" />

          {!collapsed && <span>Sign Out</span>}
        </button>

        {!collapsed && (
          <p className="mt-4 text-xs text-gray-400">
            Track your money. Manage your future.
          </p>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
