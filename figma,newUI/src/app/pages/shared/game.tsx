import PlaceholderPage from '../../components/placeholder-page';
import { Gamepad2 } from 'lucide-react';

export default function Game() {
  return (
    <PlaceholderPage
      title="Dental Health Game"
      description="Learn about oral health through interactive games"
      icon={Gamepad2}
      features={[
        'Educational mini-games about dental care',
        'Earn points and unlock achievements',
        'Daily challenges and quests',
        'Kid-friendly oral health education',
        'Track learning progress',
      ]}
    />
  );
}
