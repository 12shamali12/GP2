import PlaceholderPage from '../../components/placeholder-page';
import { Calendar } from 'lucide-react';

export default function PatientAppointments() {
  return (
    <PlaceholderPage
      title="My Appointments"
      description="View your appointment history and upcoming visits"
      icon={Calendar}
      features={[
        'Complete appointment history with treatment details',
        'Upcoming appointment reminders',
        'Quick reschedule and cancellation options',
        'Download appointment summaries and receipts',
        'View doctor notes and treatment plans',
      ]}
    />
  );
}
