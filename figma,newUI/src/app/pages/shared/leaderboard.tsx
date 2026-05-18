import PlaceholderPage from '../../components/placeholder-page';
import { Trophy } from 'lucide-react';

export default function Leaderboard() {
  return (
    <PlaceholderPage
      title="Leaderboard"
      description="Compete and earn rewards for maintaining excellent oral health"
      icon={Trophy}
      features={[
        'Monthly and all-time rankings',
        'Points for appointments and checkups',
        'Achievement badges and rewards',
        'Challenge friends and family',
        'Redeem points for discounts',
      ]}
    />
  );
}
