import PlaceholderPage from '../../components/placeholder-page';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Customize your DentyHub experience"
      icon={SettingsIcon}
      features={[
        'Account settings and preferences',
        'Privacy and security controls',
        'Notification preferences',
        'Language and regional settings',
        'Two-factor authentication',
      ]}
    />
  );
}
