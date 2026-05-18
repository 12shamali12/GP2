import { motion } from 'motion/react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Edit,
  Camera,
  Shield,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Progress } from '../../components/ui/progress';

export default function PatientProfile() {
  const profileData = {
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '+1 (555) 987-6543',
    location: 'New York, NY',
    joinDate: 'March 2024',
    dateOfBirth: 'May 15, 1992',
    bloodType: 'A+',
    healthScore: 92,
    totalVisits: 18,
    upcomingAppointments: 2,
  };

  const medicalInfo = [
    { label: 'Allergies', value: 'Penicillin' },
    { label: 'Current Medications', value: 'None' },
    { label: 'Last Dental Visit', value: 'Feb 10, 2026' },
    { label: 'Insurance Provider', value: 'Blue Cross' },
  ];

  const healthMetrics = [
    { label: 'Oral Hygiene', value: 88, color: 'bg-accent' },
    { label: 'Treatment Compliance', value: 95, color: 'bg-primary' },
    { label: 'Regular Checkups', value: 85, color: 'bg-warning' },
  ];

  return (
    <div className="space-y-6 max-w-[1200px]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal and medical information
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <Card className="p-6">
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="w-32 h-32 bg-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-4xl">
                    MC
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full w-10 h-10 bg-white border-2 border-white shadow-lg"
                >
                  <Camera className="w-5 h-5 text-primary" />
                </Button>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {profileData.name}
              </h2>
              <p className="text-muted-foreground mb-4">Patient</p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <Badge className="bg-accent text-accent-foreground">
                  <Heart className="w-3 h-3 mr-1" />
                  {profileData.healthScore}% Health Score
                </Badge>
                <Badge variant="outline">{profileData.totalVisits} Visits</Badge>
              </div>
              <Button className="w-full bg-primary hover:bg-primary-hover">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-border space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">{profileData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">{profileData.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">{profileData.location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Member since {profileData.joinDate}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Medical Information */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                Medical Information
              </h3>
              <Badge variant="outline" className="gap-1">
                <Shield className="w-3 h-3" />
                Private
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Date of Birth
                </p>
                <p className="font-medium text-foreground">
                  {profileData.dateOfBirth}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Blood Type</p>
                <p className="font-medium text-foreground">
                  {profileData.bloodType}
                </p>
              </div>
              {medicalInfo.map((info) => (
                <div key={info.label}>
                  <p className="text-sm text-muted-foreground mb-2">
                    {info.label}
                  </p>
                  <p className="font-medium text-foreground">{info.value}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Health Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Health Metrics
            </h3>
            <div className="space-y-6">
              {healthMetrics.map((metric) => (
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
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Visits</p>
              <p className="text-3xl font-bold text-foreground mb-1">
                {profileData.totalVisits}
              </p>
              <p className="text-xs text-muted-foreground">Since joining</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">
                Upcoming Appointments
              </p>
              <p className="text-3xl font-bold text-foreground mb-1">
                {profileData.upcomingAppointments}
              </p>
              <p className="text-xs text-muted-foreground">Next: Tomorrow</p>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
