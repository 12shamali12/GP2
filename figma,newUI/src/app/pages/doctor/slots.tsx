import PlaceholderPage from '../../components/placeholder-page';
import { Clock } from 'lucide-react';

export default function DoctorSlots() {
  return (
    <PlaceholderPage
      title="My Slots"
      description="Manage your availability and appointment slots"
      icon={Clock}
      features={[
        'Set weekly availability schedules',
        'Block specific dates for holidays or events',
        'Configure slot duration and buffer times',
        'Manage multiple clinic locations',
        'Real-time slot availability updates',
      ]}
    />
  );
}
