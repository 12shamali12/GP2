import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Star,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Calendar } from '../../components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';

const doctors = [
  {
    id: 1,
    name: 'Dr. Sarah Johnson',
    specialty: 'General Dentist',
    rating: 4.9,
    reviews: 234,
    experience: '15 years',
    location: 'Downtown Clinic',
    initials: 'SJ',
    available: true,
  },
  {
    id: 2,
    name: 'Dr. Michael Chen',
    specialty: 'Orthodontist',
    rating: 4.8,
    reviews: 189,
    experience: '12 years',
    location: 'Westside Dental',
    initials: 'MC',
    available: true,
  },
  {
    id: 3,
    name: 'Dr. Emily Rodriguez',
    specialty: 'Pediatric Dentist',
    rating: 4.9,
    reviews: 156,
    experience: '10 years',
    location: 'Family Dental Care',
    initials: 'ER',
    available: false,
  },
  {
    id: 4,
    name: 'Dr. David Park',
    specialty: 'Cosmetic Dentist',
    rating: 4.7,
    reviews: 142,
    experience: '18 years',
    location: 'Smile Center',
    initials: 'DP',
    available: true,
  },
];

const timeSlots = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
];

const appointmentTypes = [
  'Regular Checkup',
  'Teeth Cleaning',
  'Root Canal',
  'Crown Fitting',
  'Tooth Extraction',
  'Teeth Whitening',
  'Consultation',
  'Emergency',
];

export default function PatientBooking() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDoctor, setSelectedDoctor] = useState<typeof doctors[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBookAppointment = () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !appointmentType) {
      toast.error('Please complete all required fields');
      return;
    }

    toast.success('Appointment booked successfully!');
    // Reset form
    setStep(1);
    setSelectedDoctor(null);
    setSelectedDate(new Date());
    setSelectedTime('');
    setAppointmentType('');
    setNotes('');
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Book Appointment
        </h1>
        <p className="text-muted-foreground">
          Schedule your next dental visit in three easy steps
        </p>
      </motion.div>

      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Select Doctor' },
              { num: 2, label: 'Choose Date & Time' },
              { num: 3, label: 'Confirm Details' },
            ].map((s, index) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step >= s.num
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                  </div>
                  <div className="hidden md:block">
                    <p
                      className={`text-sm font-medium ${
                        step >= s.num ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {s.label}
                    </p>
                  </div>
                </div>
                {index < 2 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      step > s.num ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Search and Filter */}
            <Card className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search doctors by name or specialty..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                <Button variant="outline" className="h-12">
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                </Button>
              </div>
            </Card>

            {/* Doctors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDoctors.map((doctor) => (
                <motion.div
                  key={doctor.id}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className={`p-6 cursor-pointer transition-all ${
                      selectedDoctor?.id === doctor.id
                        ? 'border-primary border-2 shadow-lg'
                        : 'hover:shadow-lg'
                    } ${!doctor.available ? 'opacity-60' : ''}`}
                    onClick={() => doctor.available && setSelectedDoctor(doctor)}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16 bg-primary">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
                          {doctor.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground text-lg mb-1">
                              {doctor.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {doctor.specialty}
                            </p>
                          </div>
                          {selectedDoctor?.id === doctor.id && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-warning text-warning" />
                            <span className="font-medium text-foreground">
                              {doctor.rating}
                            </span>
                            <span>({doctor.reviews})</span>
                          </div>
                          <span>•</span>
                          <span>{doctor.experience}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{doctor.location}</span>
                        </div>
                        {!doctor.available && (
                          <Badge variant="outline" className="mt-3">
                            Currently Unavailable
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedDoctor}
                className="bg-primary hover:bg-primary-hover"
              >
                Continue
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Calendar */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Select Date
              </h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-xl border"
              />
            </Card>

            {/* Time Slots */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Available Time Slots
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? 'default' : 'outline'}
                      className={`h-12 ${
                        selectedTime === time
                          ? 'bg-primary hover:bg-primary-hover'
                          : ''
                      }`}
                      onClick={() => setSelectedTime(time)}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      {time}
                    </Button>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Appointment Type
                </h3>
                <Select value={appointmentType} onValueChange={setAppointmentType}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select appointment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Card>
            </div>

            <div className="lg:col-span-2 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedTime || !appointmentType}
                className="bg-primary hover:bg-primary-hover"
              >
                Continue
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Appointment Summary
              </h3>
              <div className="space-y-6">
                {/* Doctor */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Doctor</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 bg-primary">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {selectedDoctor?.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {selectedDoctor?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedDoctor?.specialty}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Date & Time</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">
                        {selectedDate?.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">
                        {selectedTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Type */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Appointment Type
                  </p>
                  <Badge className="bg-primary text-primary-foreground">
                    {appointmentType}
                  </Badge>
                </div>

                {/* Location */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Location</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">
                      {selectedDoctor?.location}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Additional Notes */}
            <div className="space-y-6">
              <Card className="p-6">
                <Label htmlFor="notes" className="text-lg font-semibold mb-4 block">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests or information for the doctor..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </Card>

              <Card className="p-6 bg-primary-light border-primary/20">
                <h4 className="font-semibold text-foreground mb-2">
                  Appointment Reminders
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  You'll receive reminders via email and SMS 24 hours and 1 hour
                  before your appointment.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-accent" />
                  <span>Email notification enabled</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-accent" />
                  <span>SMS notification enabled</span>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-2 flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleBookAppointment}
                className="bg-primary hover:bg-primary-hover"
              >
                <Check className="w-5 h-5 mr-2" />
                Confirm Booking
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
