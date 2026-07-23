import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, MapPinned, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { DeactivateRegionDialog } from '../components/DeactivateRegionDialog';
import { RegionFormDialog } from '../components/RegionFormDialog';
import { RegionService } from '../services/region.service';

function RegionTableSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-14 w-full" />
      ))}
    </div>
  );
}

function RegionStatusBadge({ active }) {
  const { t } = useTranslation(['admin']);

  return (
    <Badge variant={active ? 'success' : 'secondary'}>
      {active ? t('regions.status.active') : t('regions.status.inactive')}
    </Badge>
  );
}

export function RegionsPage() {
  const { t } = useTranslation(['admin']);
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionToDeactivate, setRegionToDeactivate] = useState(null);

  const regionsQuery = useQuery({
    queryKey: ['admin', 'regions'],
    queryFn: () => RegionService.list({ all: true }),
  });

  const regions = regionsQuery.data ?? [];

  const deactivateMutation = useMutation({
    mutationFn: (regionId) => RegionService.deactivate(regionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'regions'] });
      setRegionToDeactivate(null);
    },
  });

  const openCreateDialog = () => {
    setSelectedRegion(null);
    setFormOpen(true);
  };

  const openEditDialog = (region) => {
    setSelectedRegion(region);
    setFormOpen(true);
  };

  const openDeactivateDialog = (region) => {
    deactivateMutation.reset();
    setRegionToDeactivate(region);
  };

  const closeDeactivateDialog = (nextOpen) => {
    if (!nextOpen) {
      deactivateMutation.reset();
      setRegionToDeactivate(null);
    }
  };

  const confirmDeactivate = () => {
    if (regionToDeactivate?.id) {
      deactivateMutation.mutate(regionToDeactivate.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary rtl:normal-case rtl:tracking-normal">
            {t('regions.eyebrow')}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t('regions.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t('regions.description')}
          </p>
        </div>
        <Button type="button" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          {t('regions.actions.create')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('regions.table.title')}</CardTitle>
          <CardDescription>{t('regions.table.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {regionsQuery.isLoading && <RegionTableSkeleton />}

          {regionsQuery.isError && (
            <EmptyState
              icon={MapPinned}
              title={t('regions.states.errorTitle')}
              description={t('regions.states.errorDescription')}
              action={(
                <Button type="button" variant="outline" onClick={() => regionsQuery.refetch()}>
                  {t('regions.actions.retry')}
                </Button>
              )}
            />
          )}

          {!regionsQuery.isLoading && !regionsQuery.isError && regions.length === 0 && (
            <EmptyState
              icon={MapPinned}
              title={t('regions.states.emptyTitle')}
              description={t('regions.states.emptyDescription')}
              action={(
                <Button type="button" onClick={openCreateDialog}>
                  {t('regions.actions.create')}
                </Button>
              )}
            />
          )}

          {!regionsQuery.isLoading && !regionsQuery.isError && regions.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('regions.table.name')}</TableHead>
                  <TableHead>{t('regions.table.descriptionColumn')}</TableHead>
                  <TableHead>{t('regions.table.userCount')}</TableHead>
                  <TableHead>{t('regions.table.status')}</TableHead>
                  <TableHead className="text-end">{t('regions.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regions.map((region) => (
                  <TableRow key={region.id}>
                    <TableCell>
                      <p className="font-medium">{region.name}</p>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-xl text-sm text-muted-foreground">
                        {region.description || t('regions.table.noDescription')}
                      </p>
                    </TableCell>
                    <TableCell>{region.userCount ?? 0}</TableCell>
                    <TableCell>
                      <RegionStatusBadge active={region.isActive && !region.deletedAt} />
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(region)}
                        >
                          <Edit className="h-4 w-4" />
                          {t('regions.actions.edit')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => openDeactivateDialog(region)}
                          disabled={!region.isActive || Boolean(region.deletedAt)}
                        >
                          <Trash2 className="h-4 w-4" />
                          {t('regions.actions.deactivate')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RegionFormDialog
        region={selectedRegion}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <DeactivateRegionDialog
        region={regionToDeactivate}
        open={Boolean(regionToDeactivate)}
        onOpenChange={closeDeactivateDialog}
        onConfirm={confirmDeactivate}
        isPending={deactivateMutation.isPending}
        error={deactivateMutation.error}
      />
    </div>
  );
}
