import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';

export function AssignmentStatusBadge({ active = true }) {
  const { t } = useTranslation(['admin']);

  return (
    <Badge variant={active ? 'success' : 'secondary'}>
      {active ? t('mentorAssignments.status.active') : t('mentorAssignments.status.inactive')}
    </Badge>
  );
}
