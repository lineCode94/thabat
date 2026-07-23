import { Award, Medal, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

const REWARD_TYPES = [
  { key: 'badges', icon: Medal },
  { key: 'achievements', icon: Award },
  { key: 'missions', icon: Target },
];

function getRewardName(reward) {
  return reward.name ?? reward.title;
}

export function RewardList({ rewards = {} }) {
  const { t } = useTranslation(['reports']);
  const items = REWARD_TYPES.flatMap((type) => (
    rewards[type.key] ?? []
  ).map((reward) => ({ ...reward, rewardType: type.key, Icon: type.icon })));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('shared.rewards.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={Award}
            title={t('shared.rewards.emptyTitle')}
            description={t('shared.rewards.emptyDescription')}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((reward) => {
              const Icon = reward.Icon;

              return (
                <div
                  key={`${reward.rewardType}-${reward.id ?? reward.key ?? reward.userMissionId}`}
                  className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500 text-white shadow-[0_12px_30px_rgba(139,92,246,0.35)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <Badge variant="secondary">{t(`shared.rewards.types.${reward.rewardType}`)}</Badge>
                      <h3 className="mt-2 truncate text-sm font-semibold text-card-foreground">
                        {getRewardName(reward)}
                      </h3>
                      {reward.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{reward.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
