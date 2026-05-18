import PlaceholderPage from '../../components/placeholder-page';
import { Bell } from 'lucide-react';

export default function Notifications() {
  return (
    <PlaceholderPage
      title="Notifications"
      description="Stay updated with all your important alerts and messages"
      icon={Bell}
      features={[
        'Real-time notification center',
        'Filter by type (appointments, messages, system)',
        'Mark as read/unread functionality',
        'Notification preferences and settings',
        'Push notification support',
      ]}
    />
  );
}
