import { motion } from 'motion/react';
import {
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const statsData = [
  {
    label: 'Doctors Supervised',
    value: '24',
    change: '+2 this month',
    icon: Users,
    color: 'text-primary',
    bgColor: 'bg-primary-light',
  },
  {
    label: 'Total Patients',
    value: '856',
    change: 'Across all doctors',
    icon: Activity,
    color: 'text-accent',
    bgColor: 'bg-accent-light',
  },
  {
    label: 'Quality Score',
    value: '96%',
    change: '+4% from last quarter',
    icon: TrendingUp,
    color: 'text-accent',
    bgColor: 'bg-accent-light',
  },
  {
    label: 'Issues Flagged',
    value: '3',
    change: 'Requires attention',
    icon: AlertCircle,
    color: 'text-warning',
    bgColor: 'bg-warning-light',
  },
];

const performanceData = [
  { month: 'Jan', patients: 680, quality: 94 },
  { month: 'Feb', patients: 720, quality: 95 },
  { month: 'Mar', patients: 760, quality: 93 },
  { month: 'Apr', patients: 800, quality: 96 },
  { month: 'May', patients: 830, quality: 95 },
  { month: 'Jun', patients: 856, quality: 96 },
];

const topDoctors = [
  { name: 'Dr. Sarah Johnson', patients: 248, rating: 4.9, initials: 'SJ' },
  { name: 'Dr. Michael Chen', patients: 215, rating: 4.8, initials: 'MC' },
  { name: 'Dr. Emily Rodriguez', patients: 198, rating: 4.9, initials: 'ER' },
  { name: 'Dr. David Park', patients: 185, rating: 4.7, initials: 'DP' },
];

export default function SupervisorDashboard() {
  return (
    <div className="space-y-8 max-w-[1400px]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Supervisor Dashboard
        </h1>
        <p className="text-muted-foreground">
          Monitor and manage clinical operations
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

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Patient Volume Trend
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={performanceData}>
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
              <Bar dataKey="patients" fill="#0B7B8A" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Quality Score Trend
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={performanceData}>
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
              <Line
                type="monotone"
                dataKey="quality"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Top Performers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Top Performing Doctors
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topDoctors.map((doctor, index) => (
              <Card key={doctor.name} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {doctor.initials}
                    </span>
                  </div>
                  <Badge className="bg-accent text-accent-foreground">
                    #{index + 1}
                  </Badge>
                </div>
                <p className="font-semibold text-foreground mb-1 text-sm">
                  {doctor.name}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{doctor.patients} patients</span>
                  <span>⭐ {doctor.rating}</span>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
