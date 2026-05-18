import PlaceholderPage from '../../components/placeholder-page';
import { Calendar } from 'lucide-react';

export default function DoctorAppointments() {
  return (
    <PlaceholderPage
      title="Today's Appointments"
      description="View and manage your daily appointment schedule"
      icon={Calendar}
      features={[
        'Real-time appointment schedule for the day',
        'Patient details and treatment history',
        'Quick actions: reschedule, cancel, or mark complete',
        'Add notes and treatment plans',
        'Integration with calendar apps',
      ]}
    />
  );
}
