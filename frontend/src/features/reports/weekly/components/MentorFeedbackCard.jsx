import { MessageSquareText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function MentorFeedbackCard({ feedback }) {
  const { t } = useTranslation(['reports']);

  if (!feedback) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{t('weekly.mentorFeedback.title')}</CardTitle>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MessageSquareText className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback.rating && (
          <Badge variant="secondary">
            {t('weekly.mentorFeedback.rating', { rating: feedback.rating })}
          </Badge>
        )}
        {feedback.comment && (
          <p className="text-sm leading-6 text-card-foreground">{feedback.comment}</p>
        )}
        {feedback.recommendation && (
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground rtl:normal-case rtl:tracking-normal">
              {t('weekly.mentorFeedback.recommendation')}
            </p>
            <p className="mt-2 text-sm leading-6">{feedback.recommendation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
