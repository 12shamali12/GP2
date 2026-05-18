import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  LayoutDashboard,
  User,
  Calendar,
  MessageSquare,
  Bell,
  Settings,
  Trophy,
  Gamepad2,
  CheckCircle,
  FileText,
  Clock,
  Users,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Search,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';

interface DashboardLayoutProps {
  role: 'doctor' | 'patient' | 'supervisor' | 'admin';
}

interface NavItem {
  label: string;
  icon: any;
  path: string;
  badge?: number;
  comingSoon?: boolean;
}

const navigationConfig: Record<string, NavItem[]> = {
  doctor: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/doctor' },
    { label: 'Profile', icon: User, path: '/doctor/profile' },
    { label: 'Approvals', icon: CheckCircle, path: '/doctor/approvals', badge: 3 },
    { label: 'Appointments', icon: Calendar, path: '/doctor/appointments' },
    { label: 'My Slots', icon: Clock, path: '/doctor/slots' },
    { label: 'Report', icon: FileText, path: '/doctor/report' },
    { label: 'Chat', icon: MessageSquare, path: '/doctor/chat', badge: 5 },
    { label: 'Notifications', icon: Bell, path: '/doctor/notifications', badge: 12 },
    { label: 'Settings', icon: Settings, path: '/doctor/settings', comingSoon: true },
    { label: 'Leaderboard', icon: Trophy, path: '/doctor/leaderboard', comingSoon: true },
    { label: 'Game', icon: Gamepad2, path: '/doctor/game', comingSoon: true },
  ],
  patient: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/patient' },
    { label: 'Profile', icon: User, path: '/patient/profile' },
    { label: 'Book Appointment', icon: Calendar, path: '/patient/booking' },
    { label: 'My Appointments', icon: Clock, path: '/patient/appointments' },
    { label: 'Chat', icon: MessageSquare, path: '/patient/chat', badge: 2 },
    { label: 'Notifications', icon: Bell, path: '/patient/notifications', badge: 8 },
    { label: 'Settings', icon: Settings, path: '/patient/settings', comingSoon: true },
    { label: 'Leaderboard', icon: Trophy, path: '/patient/leaderboard', comingSoon: true },
    { label: 'Game', icon: Gamepad2, path: '/patient/game', comingSoon: true },
  ],
  supervisor: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/supervisor' },
    { label: 'Profile', icon: User, path: '/supervisor/profile' },
    { label: 'Chat', icon: MessageSquare, path: '/supervisor/chat', badge: 4 },
    { label: 'Notifications', icon: Bell, path: '/supervisor/notifications', badge: 6 },
    { label: 'Settings', icon: Settings, path: '/supervisor/settings', comingSoon: true },
    { label: 'Leaderboard', icon: Trophy, path: '/supervisor/leaderboard', comingSoon: true },
    { label: 'Game', icon: Gamepad2, path: '/supervisor/game', comingSoon: true },
  ],
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Doctor Requests', icon: CheckCircle, path: '/admin/doctor-requests', badge: 7 },
    { label: 'Supervisor Requests', icon: CheckCircle, path: '/admin/supervisor-requests', badge: 3 },
    { label: 'User Management', icon: Users, path: '/admin/users' },
    { label: 'Notifications', icon: Bell, path: '/admin/notifications', badge: 15 },
    { label: 'Settings', icon: Settings, path: '/admin/settings', comingSoon: true },
  ],
};

const roleLabels = {
  doctor: 'Doctor',
  patient: 'Patient',
  supervisor: 'Supervisor',
  admin: 'Administrator',
};

export default function DashboardLayout({ role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = navigationConfig[role];
  const currentPath = location.pathname;

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/auth/login');
  };

  const getUserInitials = () => {
    const labels = {
      doctor: 'DR',
      patient: 'PT',
      supervisor: 'SV',
      admin: 'AD',
    };
    return labels[role];
  };

  const getUserName = () => {
    const names = {
      doctor: 'Dr. Sarah Johnson',
      patient: 'Michael Chen',
      supervisor: 'David Williams',
      admin: 'Admin User',
    };
    return names[role];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col border-r border-border bg-card"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-border px-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B7B8A] to-[#10B981] flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-semibold text-foreground">DentyHub</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = currentPath === item.path;
                const Icon = item.icon;

                return (
                  <motion.button
                    key={item.path}
                    onClick={() => !item.comingSoon && navigate(item.path)}
                    disabled={item.comingSoon}
                    whileHover={!item.comingSoon ? { x: 4 } : {}}
                    whileTap={!item.comingSoon ? { scale: 0.98 } : {}}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : item.comingSoon
                        ? 'text-muted-foreground cursor-not-allowed opacity-60'
                        : 'text-foreground hover:bg-secondary'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && !item.comingSoon && (
                      <Badge
                        variant={isActive ? "secondary" : "default"}
                        className={`${isActive ? 'bg-white/20 text-white' : 'bg-destructive'} px-2 py-0.5`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {item.comingSoon && (
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        Soon
                      </Badge>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </nav>

          {/* User Profile */}
          <div className="border-t border-border p-4">
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary transition-colors"
              >
                <Avatar className="w-10 h-10 bg-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-foreground">{getUserName()}</div>
                  <div className="text-xs text-muted-foreground">{roleLabels[role]}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        navigate(`/${role}/profile`);
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-sm"
                    >
                      <User className="w-4 h-4" />
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate(`/${role}/settings`);
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-sm"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <div className="border-t border-border" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive-light text-destructive transition-colors text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 lg:hidden flex flex-col"
            >
              <div className="flex h-16 items-center justify-between border-b border-border px-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B7B8A] to-[#10B981] flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-xl font-semibold text-foreground">DentyHub</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-6">
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = currentPath === item.path;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          if (!item.comingSoon) {
                            navigate(item.path);
                            setSidebarOpen(false);
                          }
                        }}
                        disabled={item.comingSoon}
                        className={`
                          w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all
                          ${isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : item.comingSoon
                            ? 'text-muted-foreground cursor-not-allowed opacity-60'
                            : 'text-foreground hover:bg-secondary'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && !item.comingSoon && (
                          <Badge
                            variant={isActive ? "secondary" : "default"}
                            className={`${isActive ? 'bg-white/20 text-white' : 'bg-destructive'} px-2 py-0.5`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                        {item.comingSoon && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            Soon
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </nav>

              <div className="border-t border-border p-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive-light text-destructive transition-colors text-sm font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/95 backdrop-blur-sm px-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 bg-secondary border-0"
              />
            </div>
          </div>

          <div className="flex-1 lg:hidden" />

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate(`/${role}/notifications`)}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </Button>

            {/* Mobile Profile */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/${role}/profile`)}
              >
                <Avatar className="w-8 h-8 bg-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>
        </motion.header>

        {/* Page Content */}
        <main className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
