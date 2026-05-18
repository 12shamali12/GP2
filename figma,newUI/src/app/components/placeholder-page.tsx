import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features?: string[];
}

export default function PlaceholderPage({
  title,
  description,
  icon: Icon,
  features = [],
}: PlaceholderPageProps) {
  return (
    <div className="space-y-8 max-w-[1200px]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-light flex items-center justify-center">
              <Icon className="w-10 h-10 text-primary" strokeWidth={2} />
            </div>
            <Badge className="mb-4 bg-warning text-warning-foreground">
              Coming Soon
            </Badge>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Feature In Development
            </h2>
            <p className="text-muted-foreground mb-6">
              We're working hard to bring you this feature. Stay tuned for updates!
            </p>
            {features.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Planned Features:
                </h3>
                <div className="grid gap-3 text-left">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
