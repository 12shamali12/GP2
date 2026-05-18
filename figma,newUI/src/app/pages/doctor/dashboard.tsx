import { motion } from 'motion/react';
import {
  Calendar,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const statsData = [
  {
    label: "Today's Appointments",
    value: '12',
    change: '+2 from yesterday',
    icon: Calendar,
    color: 'text-primary',
    bgColor: 'bg-primary-light',
  },
  {
    label: 'Total Patients',
    value: '248',
    change: '+15 this month',
    icon: Users,
    color: 'text-accent',
    bgColor: 'bg-accent-light',
  },
  {
    label: 'Pending Approvals',
    value: '3',
    change: 'Requires action',
    icon: AlertCircle,
    color: 'text-warning',
    bgColor: 'bg-warning-light',
  },
  {
    label: 'Avg. Rating',
    value: '4.8',
    change: '+0.2 this week',
    icon: TrendingUp,
    color: 'text-accent',
    bgColor: 'bg-accent-light',
  },
];

const performanceData = [
  { day: 'Mon', patients: 12, revenue: 2400 },
  { day: 'Tue', patients: 15, revenue: 3000 },
  { day: 'Wed', patients: 10, revenue: 2000 },
  { day: 'Thu', patients: 18, revenue: 3600 },
  { day: 'Fri', patients: 14, revenue: 2800 },
  { day: 'Sat', patients: 8, revenue: 1600 },
  { day: 'Sun', patients: 5, revenue: 1000 },
];

const todayAppointments = [
  {
    id: 1,
    patientName: 'Emily Thompson',
    time: '09:00 AM',
    type: 'Regular Checkup',
    status: 'confirmed',
    initials: 'ET',
  },
  {
    id: 2,
    patientName: 'Michael Rodriguez',
    time: '10:30 AM',
    type: 'Teeth Cleaning',
    status: 'confirmed',
    initials: 'MR',
  },
  {
    id: 3,
    patientName: 'Sarah Johnson',
    time: '11:45 AM',
    type: 'Root Canal',
    status: 'in-progress',
    initials: 'SJ',
  },
  {
    id: 4,
    patientName: 'David Chen',
    time: '02:00 PM',
    type: 'Crown Fitting',
    status: 'confirmed',
    initials: 'DC',
  },
  {
    id: 5,
    patientName: 'Lisa Anderson',
    time: '03:30 PM',
    type: 'Consultation',
    status: 'pending',
    initials: 'LA',
  },
];

const pendingApprovals = [
  {
    id: 1,
    patientName: 'John Walker',
    requestType: 'Treatment Plan',
    date: '2 hours ago',
    initials: 'JW',
  },
  {
    id: 2,
    patientName: 'Maria Garcia',
    requestType: 'Prescription Renewal',
    date: '5 hours ago',
    initials: 'MG',
  },
  {
    id: 3,
    patientName: 'Robert Brown',
    requestType: 'Medical Records',
    date: '1 day ago',
    initials: 'RB',
  },
];

export default function DoctorDashboard() {
  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, Dr. Johnson
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your practice today
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
        {/* Today's Appointments */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Today's Appointments
                </h3>
                <p className="text-sm text-muted-foreground">
                  {todayAppointments.length} appointments scheduled
                </p>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>

            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <motion.div
                  key={appointment.id}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary transition-colors cursor-pointer"
                >
                  <Avatar className="w-12 h-12 bg-primary">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {appointment.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {appointment.patientName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground mb-1">
                      {appointment.time}
                    </p>
                    <Badge
                      variant={
                        appointment.status === 'confirmed'
                          ? 'default'
                          : appointment.status === 'in-progress'
                          ? 'secondary'
                          : 'outline'
                      }
                      className={
                        appointment.status === 'confirmed'
                          ? 'bg-accent text-accent-foreground'
                          : appointment.status === 'in-progress'
                          ? 'bg-primary text-primary-foreground'
                          : ''
                      }
                    >
                      {appointment.status === 'confirmed'
                        ? 'Confirmed'
                        : appointment.status === 'in-progress'
                        ? 'In Progress'
                        : 'Pending'}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Pending Approvals */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Pending Approvals
                </h3>
                <p className="text-sm text-muted-foreground">
                  {pendingApprovals.length} items need attention
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <motion.div
                  key={approval.id}
                  whileHover={{ x: 4 }}
                  className="p-4 rounded-xl hover:bg-secondary transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 bg-warning-light">
                      <AvatarFallback className="bg-warning-light text-warning font-semibold text-sm">
                        {approval.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm mb-1">
                        {approval.patientName}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {approval.requestType}
                      </p>
                      <p className="text-xs text-muted-foreground">{approval.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1 h-8 text-xs bg-accent hover:bg-accent/90">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Approve
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      Review
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-4">
              View All Requests
            </Button>
          </Card>
        </motion.div>
      </div>

      {/* Performance Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Weekly Patients Chart */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Weekly Patient Volume
            </h3>
            <p className="text-sm text-muted-foreground">
              Patient appointments this week
            </p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#64748B" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748B" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="patients" fill="#0B7B8A" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue Trend */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Revenue Trend
            </h3>
            <p className="text-sm text-muted-foreground">
              Daily revenue overview
            </p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#64748B" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748B" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'New Patient', icon: Users, color: 'bg-primary' },
              { label: 'View Schedule', icon: Calendar, color: 'bg-accent' },
              { label: 'Update Slots', icon: Clock, color: 'bg-warning' },
              { label: 'View Reports', icon: Activity, color: 'bg-info' },
            ].map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-24 flex-col gap-2 hover:border-primary hover:text-primary transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
