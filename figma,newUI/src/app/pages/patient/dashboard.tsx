import { motion } from 'motion/react';
import {
  Calendar,
  Clock,
  Star,
  Heart,
  Activity,
  ArrowUpRight,
  Plus,
  MapPin,
  Phone,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Progress } from '../../components/ui/progress';

const statsData = [
  {
    label: 'Upcoming Appointments',
    value: '2',
    change: 'Next: Tomorrow 10:00 AM',
    icon: Calendar,
    color: 'text-primary',
    bgColor: 'bg-primary-light',
  },
  {
    label: 'Total Visits',
    value: '18',
    change: 'Last visit: 2 weeks ago',
    icon: Activity,
    color: 'text-accent',
    bgColor: 'bg-accent-light',
  },
  {
    label: 'Health Score',
    value: '92%',
    change: '+5% this quarter',
    icon: Heart,
    color: 'text-destructive',
    bgColor: 'bg-destructive-light',
  },
  {
    label: 'Active Treatments',
    value: '1',
    change: 'Orthodontics ongoing',
    icon: Star,
    color: 'text-warning',
    bgColor: 'bg-warning-light',
  },
];

const upcomingAppointments = [
  {
    id: 1,
    doctorName: 'Dr. Sarah Johnson',
    specialty: 'General Dentist',
    date: 'Tomorrow',
    time: '10:00 AM',
    type: 'Regular Checkup',
    location: 'Downtown Clinic',
    initials: 'SJ',
  },
  {
    id: 2,
    doctorName: 'Dr. Michael Chen',
    specialty: 'Orthodontist',
    date: 'Mar 25, 2026',
    time: '02:30 PM',
    type: 'Braces Adjustment',
    location: 'Westside Dental',
    initials: 'MC',
  },
];

const recentActivity = [
  {
    id: 1,
    type: 'appointment',
    title: 'Completed teeth cleaning',
    description: 'Dr. Sarah Johnson',
    date: '2 weeks ago',
    icon: Calendar,
  },
  {
    id: 2,
    type: 'prescription',
    title: 'New prescription added',
    description: 'Fluoride rinse - 2x daily',
    date: '3 weeks ago',
    icon: Activity,
  },
  {
    id: 3,
    type: 'report',
    title: 'Lab results available',
    description: 'X-ray imaging report',
    date: '1 month ago',
    icon: Star,
  },
];

const recommendedDoctors = [
  {
    id: 1,
    name: 'Dr. Emily Rodriguez',
    specialty: 'Pediatric Dentist',
    rating: 4.9,
    reviews: 234,
    initials: 'ER',
  },
  {
    id: 2,
    name: 'Dr. David Park',
    specialty: 'Cosmetic Dentist',
    rating: 4.8,
    reviews: 189,
    initials: 'DP',
  },
  {
    id: 3,
    name: 'Dr. Lisa Martinez',
    specialty: 'Endodontist',
    rating: 4.9,
    reviews: 156,
    initials: 'LM',
  },
];

export default function PatientDashboard() {
  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, Michael
          </h1>
          <p className="text-muted-foreground">
            Your dental health journey at a glance
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary-hover">
          <Plus className="w-5 h-5 mr-2" />
          Book Appointment
        </Button>
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
        {/* Upcoming Appointments */}
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
                  Upcoming Appointments
                </h3>
                <p className="text-sm text-muted-foreground">
                  {upcomingAppointments.length} appointments scheduled
                </p>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>

            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <motion.div
                  key={appointment.id}
                  whileHover={{ x: 4 }}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-secondary transition-colors cursor-pointer border border-border"
                >
                  <Avatar className="w-14 h-14 bg-primary">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {appointment.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground mb-1">
                      {appointment.doctorName}
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      {appointment.specialty}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{appointment.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{appointment.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{appointment.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge className="bg-primary text-primary-foreground">
                      {appointment.type}
                    </Badge>
                    <Button variant="outline" size="sm" className="h-8">
                      <Phone className="w-3 h-3 mr-1" />
                      Call
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Schedule New Appointment
            </Button>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Recent Activity
              </h3>
              <p className="text-sm text-muted-foreground">
                Your latest health updates
              </p>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <motion.div
                  key={activity.id}
                  whileHover={{ x: 4 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                    <activity.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm mb-1">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground mb-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Health Progress & Recommended Doctors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Oral Health Progress
              </h3>
              <p className="text-sm text-muted-foreground">
                Track your dental health improvements
              </p>
            </div>

            <div className="space-y-6">
              {[
                { label: 'Overall Health', value: 92, color: 'bg-primary' },
                { label: 'Hygiene Score', value: 88, color: 'bg-accent' },
                { label: 'Treatment Progress', value: 75, color: 'bg-warning' },
              ].map((metric) => (
                <div key={metric.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {metric.label}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {metric.value}%
                    </span>
                  </div>
                  <Progress value={metric.value} className="h-2" />
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-accent-light">
              <p className="text-sm font-medium text-accent-foreground mb-1">
                Great progress! 🎉
              </p>
              <p className="text-xs text-muted-foreground">
                You're doing excellent with your oral hygiene routine. Keep up the good work!
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Recommended Doctors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Recommended Doctors
              </h3>
              <p className="text-sm text-muted-foreground">
                Top-rated specialists in your area
              </p>
            </div>

            <div className="space-y-4">
              {recommendedDoctors.map((doctor) => (
                <motion.div
                  key={doctor.id}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary transition-colors cursor-pointer"
                >
                  <Avatar className="w-12 h-12 bg-primary">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {doctor.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground mb-1">
                      {doctor.name}
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {doctor.specialty}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        <span className="text-sm font-medium text-foreground">
                          {doctor.rating}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({doctor.reviews} reviews)
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Book
                  </Button>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
