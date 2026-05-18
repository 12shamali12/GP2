import PlaceholderPage from '../../components/placeholder-page';
import { UserCheck } from 'lucide-react';

export default function AdminDoctorRequests() {
  return (
    <PlaceholderPage
      title="Doctor Approval Requests"
      description="Review and approve doctor registration requests"
      icon={UserCheck}
      features={[
        'View detailed doctor profiles and credentials',
        'Verify medical license numbers',
        'Review specialization and experience',
        'Approve or reject with comments',
        'Automated verification integration',
      ]}
    />
  );
}
