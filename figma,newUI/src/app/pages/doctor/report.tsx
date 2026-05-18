import PlaceholderPage from '../../components/placeholder-page';
import { FileText } from 'lucide-react';

export default function DoctorReport() {
  return (
    <PlaceholderPage
      title="Appointment Report"
      description="View detailed reports and analytics for your appointments"
      icon={FileText}
      features={[
        'Comprehensive appointment history and analytics',
        'Patient treatment outcomes and progress tracking',
        'Revenue and performance metrics',
        'Exportable reports in PDF and CSV formats',
        'Custom date range filtering and analysis',
      ]}
    />
  );
}
