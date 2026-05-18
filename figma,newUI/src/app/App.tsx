import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Activity, Shield, Users, Calendar } from 'lucide-react';
import { Button } from './components/ui/button';

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate checking for existing session
    const checkAuth = () => {
      const userRole = localStorage.getItem('userRole');
      if (userRole) {
        navigate(`/${userRole}`);
      }
    };
    checkAuth();
  }, [navigate]);

  const features = [
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Effortlessly manage appointments with intelligent slot allocation and automated reminders.',
    },
    {
      icon: Users,
      title: 'Patient Management',
      description: 'Comprehensive patient profiles, treatment history, and seamless communication.',
    },
    {
      icon: Activity,
      title: 'Performance Analytics',
      description: 'Real-time insights into clinic performance, doctor productivity, and patient satisfaction.',
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with full HIPAA compliance for patient data protection.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFBFC] via-[#F0F9FA] to-[#E6F4F6]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border/50 bg-white/80 backdrop-blur-sm"
      >
        <div className="container mx-auto px-6 py-5 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B7B8A] to-[#10B981] flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-semibold text-foreground">DentyHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/auth/login')}
              className="text-base"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate('/auth/register')}
              className="bg-primary hover:bg-primary-hover text-base"
            >
              Get Started
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-light text-primary text-sm font-medium mb-6"
          >
            <Shield className="w-4 h-4" />
            Trusted by 500+ dental clinics worldwide
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Modern Dental Practice
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0B7B8A] to-[#10B981]">
              Management Platform
            </span>
          </h1>

          <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
            Streamline your dental clinic operations with our comprehensive platform designed for 
            doctors, patients, and administrators.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/auth/register')}
              className="bg-primary hover:bg-primary-hover text-lg h-14 px-8"
            >
              Start Free Trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/auth/login')}
              className="text-lg h-14 px-8"
            >
              Watch Demo
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Stats Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="container mx-auto px-6 py-16 max-w-7xl"
      >
        <div className="bg-white rounded-3xl p-12 border border-border shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { value: '500+', label: 'Active Clinics' },
              { value: '2000+', label: 'Dental Professionals' },
              { value: '50K+', label: 'Appointments Monthly' },
              { value: '98%', label: 'Satisfaction Rate' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-border bg-white/80 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0B7B8A] to-[#10B981] flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-semibold text-foreground">DentyHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 DentyHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
