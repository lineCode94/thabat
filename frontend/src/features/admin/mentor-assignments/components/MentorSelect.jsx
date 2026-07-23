import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { MentorAssignmentService } from '../services/mentor-assignment.service';

export function MentorSelect({
  disabled = false,
  onValueChange,
  regionId = null,
  value,
}) {
  const { t } = useTranslation(['admin']);
  const mentorsQuery = useQuery({
    queryKey: ['admin', 'mentors', regionId],
    queryFn: () => MentorAssignmentService.listMentors({ regionId }),
    enabled: Boolean(regionId),
  });

  if (!regionId) {
    return (
      <p className="rounded-md border border-dashed border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        {t('mentorAssignments.states.selectUserFirst')}
      </p>
    );
  }

  if (mentorsQuery.isLoading) {
    return <Skeleton className="h-9 w-full" />;
  }

  const mentors = mentorsQuery.data ?? [];

  if (!mentorsQuery.isError && mentors.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        {t('mentorAssignments.states.noMentorsInRegion')}
      </p>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || mentorsQuery.isError}>
      <SelectTrigger>
        <SelectValue placeholder={t('mentorAssignments.form.mentorPlaceholder')} />
      </SelectTrigger>
      <SelectContent>
        {mentors.map((mentor) => (
          <SelectItem key={mentor.id} value={mentor.id}>
            {mentor.fullName} ({mentor.activeUserCount})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
