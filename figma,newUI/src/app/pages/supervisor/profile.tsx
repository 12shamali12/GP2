import PlaceholderPage from '../../components/placeholder-page';
import { User } from 'lucide-react';

export default function SupervisorProfile() {
  return (
    <PlaceholderPage
      title="Supervisor Profile"
      description="Manage your professional profile and credentials"
      icon={User}
      features={[
        'Update personal and professional information',
        'View supervised doctors and clinics',
        'Track performance metrics',
        'Manage certifications and credentials',
        'View activity history',
      ]}
    />
  );
}
