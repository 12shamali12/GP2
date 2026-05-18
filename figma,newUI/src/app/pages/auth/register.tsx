import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { Activity, Mail, Lock, User, Phone, Globe, IdCard } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { toast } from 'sonner';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    doctorId: '',
  });
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [showApprovalMessage, setShowApprovalMessage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if ((formData.role === 'doctor' || formData.role === 'supervisor') && !formData.doctorId) {
      toast.error('Professional ID is required');
      return;
    }

    setLoading(true);

    // Simulate registration
    setTimeout(() => {
      if (formData.role === 'doctor' || formData.role === 'supervisor') {
        setShowApprovalMessage(true);
        toast.success('Registration submitted! Awaiting approval.');
      } else {
        localStorage.setItem('userRole', formData.role);
        toast.success('Account created successfully!');
        navigate(`/${formData.role}`);
      }
      setLoading(false);
    }, 1000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (showApprovalMessage) {
    return (
      <div className="space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B7B8A] to-[#10B981] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-semibold text-foreground">DentyHub</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-warning-light flex items-center justify-center">
            <IdCard className="w-10 h-10 text-warning" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Awaiting Approval
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Your {formData.role} registration has been submitted successfully. 
            Our admin team will review your credentials and approve your account within 24-48 hours.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You'll receive an email notification once your account is approved.
            </p>
            <Button
              onClick={() => navigate('/auth/login')}
              className="bg-primary hover:bg-primary-hover"
            >
              Back to Sign In
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B7B8A] to-[#10B981] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-semibold text-foreground">DentyHub</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Create account</h1>
          <p className="text-muted-foreground">
            Join DentyHub and start managing your dental care
          </p>
        </motion.div>
      </div>

      {/* Language Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-end"
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              language === 'en'
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              language === 'ar'
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            AR
          </button>
        </div>
      </motion.div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Role Selection */}
        <div className="space-y-2">
          <Label htmlFor="role">Register as</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => handleChange('role', value)}
          >
            <SelectTrigger id="role" className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="patient">Patient</SelectItem>
              <SelectItem value="doctor">Doctor</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Approval Notice for Doctor/Supervisor */}
        {(formData.role === 'doctor' || formData.role === 'supervisor') && (
          <Alert className="bg-warning-light border-warning/20">
            <AlertDescription className="text-sm text-warning-foreground">
              {formData.role === 'doctor' ? 'Doctor' : 'Supervisor'} accounts require 
              admin approval. You'll be notified within 24-48 hours.
            </AlertDescription>
          </Alert>
        )}

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        {/* Doctor/Supervisor ID */}
        {(formData.role === 'doctor' || formData.role === 'supervisor') && (
          <div className="space-y-2">
            <Label htmlFor="doctorId">
              {formData.role === 'doctor' ? 'Medical License Number' : 'Professional ID'}
            </Label>
            <div className="relative">
              <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="doctorId"
                type="text"
                placeholder={formData.role === 'doctor' ? 'e.g., DEN-123456' : 'e.g., SUP-789012'}
                value={formData.doctorId}
                onChange={(e) => handleChange('doctorId', e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
        )}

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 bg-primary hover:bg-primary-hover"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>

        {/* Sign In Link */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/auth/login')}
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </button>
        </p>
      </motion.form>
    </div>
  );
}
