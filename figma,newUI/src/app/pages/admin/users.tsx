import PlaceholderPage from '../../components/placeholder-page';
import { Users } from 'lucide-react';

export default function AdminUsers() {
  return (
    <PlaceholderPage
      title="User Management"
      description="Manage all platform users and permissions"
      icon={Users}
      features={[
        'View and search all registered users',
        'Filter by role, status, and date joined',
        'Edit user profiles and permissions',
        'Suspend or deactivate accounts',
        'Export user data and reports',
      ]}
    />
  );
}
