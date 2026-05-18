import PlaceholderPage from '../../components/placeholder-page';
import { UserCheck } from 'lucide-react';

export default function AdminSupervisorRequests() {
  return (
    <PlaceholderPage
      title="Supervisor Approval Requests"
      description="Review and approve supervisor registration requests"
      icon={UserCheck}
      features={[
        'View supervisor credentials and qualifications',
        'Verify professional IDs',
        'Review management experience',
        'Approve or reject with feedback',
        'Track approval history',
      ]}
    />
  );
}
