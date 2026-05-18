import { motion } from 'motion/react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Briefcase,
  Edit,
  Camera,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Progress } from '../../components/ui/progress';

export default function DoctorProfile() {
  const profileData = {
    name: 'Dr. Sarah Johnson',
    specialty: 'General Dentist',
    email: 'sarah.johnson@dentyhub.com',
    phone: '+1 (555) 123-4567',
    location: 'Downtown Clinic, New York',
    joinDate: 'January 2020',
    licenseNumber: 'DEN-123456',
    experience: '15 years',
    rating: 4.9,
    totalPatients: 248,
    completionRate: 92,
  };

  const specializations = [
    'General Dentistry',
    'Cosmetic Dentistry',
    'Root Canal Treatment',
    'Dental Implants',
    'Teeth Whitening',
  ];

  const achievements = [
    { title: 'Top Rated Doctor', date: '2026', icon: Award },
    { title: 'Patient Choice Award', date: '2025', icon: Award },
    { title: '1000+ Successful Procedures', date: '2024', icon: Briefcase },
  ];

  return (
    <div className="space-y-6 max-w-[1200px]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
        <p className="text-muted-foreground">
          Manage your professional profile and information
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
                    SJ
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
              <p className="text-muted-foreground mb-4">
                {profileData.specialty}
              </p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <Badge className="bg-accent text-accent-foreground">
                  ⭐ {profileData.rating} Rating
                </Badge>
                <Badge variant="outline">{profileData.totalPatients} Patients</Badge>
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
                  Joined {profileData.joinDate}
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
          {/* Professional Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Professional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  License Number
                </p>
                <p className="font-medium text-foreground">
                  {profileData.licenseNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Experience</p>
                <p className="font-medium text-foreground">
                  {profileData.experience}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Total Patients
                </p>
                <p className="font-medium text-foreground">
                  {profileData.totalPatients}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Profile Completion
                </p>
                <div className="space-y-2">
                  <Progress value={profileData.completionRate} />
                  <p className="text-sm font-medium text-foreground">
                    {profileData.completionRate}%
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Specializations */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Specializations
            </h3>
            <div className="flex flex-wrap gap-2">
              {specializations.map((spec) => (
                <Badge key={spec} variant="outline" className="px-3 py-1">
                  {spec}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Achievements */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Achievements & Awards
            </h3>
            <div className="space-y-4">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-xl bg-secondary"
                >
                  <div className="w-12 h-12 rounded-xl bg-warning-light flex items-center justify-center">
                    <achievement.icon className="w-6 h-6 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {achievement.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {achievement.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
