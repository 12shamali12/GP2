import { motion } from 'motion/react';
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const statsData = [
  {
    label: 'Total Users',
    value: '1,234',
    change: '+12% from last month',
    icon: Users,
    color: 'text-primary',
    bgColor: 'bg-primary-light',
  },
  {
    label: 'Pending Approvals',
    value: '10',
    change: '7 doctors, 3 supervisors',
    icon: Clock,
    color: 'text-warning',
    bgColor: 'bg-warning-light',
  },
  {
    label: 'Active Appointments',
    value: '856',
    change: '+8% from last week',
    icon: Calendar,
    color: 'text-accent',
    bgColor: 'bg-accent-light',
  },
  {
    label: 'System Health',
    value: '99.9%',
    change: 'All systems operational',
    icon: TrendingUp,
    color: 'text-accent',
    bgColor: 'bg-accent-light',
  },
];

const userGrowthData = [
  { month: 'Jan', patients: 120, doctors: 15, supervisors: 5 },
  { month: 'Feb', patients: 150, doctors: 18, supervisors: 6 },
  { month: 'Mar', patients: 180, doctors: 22, supervisors: 7 },
  { month: 'Apr', patients: 220, doctors: 25, supervisors: 8 },
  { month: 'May', patients: 280, doctors: 30, supervisors: 10 },
  { month: 'Jun', patients: 350, doctors: 35, supervisors: 12 },
];

const userDistribution = [
  { name: 'Patients', value: 850, color: '#0B7B8A' },
  { name: 'Doctors', value: 180, color: '#10B981' },
  { name: 'Supervisors', value: 60, color: '#F59E0B' },
  { name: 'Admins', value: 10, color: '#3B82F6' },
];

const pendingApprovals = [
  {
    id: 1,
    name: 'Dr. James Wilson',
    type: 'Doctor',
    email: 'james.wilson@email.com',
    date: '2 hours ago',
    initials: 'JW',
  },
  {
    id: 2,
    name: 'Laura Martinez',
    type: 'Supervisor',
    email: 'laura.martinez@email.com',
    date: '5 hours ago',
    initials: 'LM',
  },
  {
    id: 3,
    name: 'Dr. Robert Lee',
    type: 'Doctor',
    email: 'robert.lee@email.com',
    date: '1 day ago',
    initials: 'RL',
  },
];

const recentActivity = [
  {
    id: 1,
    action: 'New user registration',
    user: 'Sarah Johnson',
    type: 'Patient',
    time: '5 minutes ago',
  },
  {
    id: 2,
    action: 'Approved doctor request',
    user: 'Dr. Michael Chen',
    type: 'Doctor',
    time: '1 hour ago',
  },
  {
    id: 3,
    action: 'Updated system settings',
    user: 'Admin User',
    type: 'Admin',
    time: '2 hours ago',
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8 max-w-[1400px]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          System overview and user management
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} strokeWidth={2} />
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Pending Approvals
                </h3>
                <p className="text-sm text-muted-foreground">
                  Requires attention
                </p>
              </div>
              <Badge className="bg-warning text-warning-foreground">
                {pendingApprovals.length}
              </Badge>
            </div>

            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="p-4 rounded-xl bg-secondary hover:shadow-sm transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="w-10 h-10 bg-primary">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                        {approval.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm mb-1">
                        {approval.name}
                      </p>
                      <p className="text-xs text-muted-foreground mb-1">
                        {approval.email}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {approval.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {approval.date}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-8 text-xs bg-accent hover:bg-accent/90">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Approve
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-4">
              View All Requests
            </Button>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm mb-1">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.user} • {activity.type}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground flex-shrink-0">
                    {activity.time}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* User Growth */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            User Growth Trend
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748B" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748B" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="patients"
                stroke="#0B7B8A"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="doctors"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="supervisors"
                stroke="#F59E0B"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* User Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            User Distribution
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={userDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {userDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>
    </div>
  );
}
