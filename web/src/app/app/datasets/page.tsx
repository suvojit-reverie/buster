'use client';

import { useGetDatasets } from '@/api/busterv2/datasets';
import { DatasetListContent } from './_DatasetListContent';
import { DatasetHeader } from './_DatasetsHeader';
import { useMemo, useState } from 'react';
import { useUserConfigContextSelector } from '@/context/Users';

export default function DashboardPage() {
  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);
  const [datasetFilter, setDatasetFilter] = useState<'all' | 'published' | 'drafts'>('all');

  const datasetsParams: Parameters<typeof useGetDatasets>[0] = useMemo(() => {
    if (datasetFilter === 'drafts') {
      return {
        enabled: false,
        admin_view: isAdmin
      };
    }

    if (datasetFilter === 'published') {
      return {
        enabled: true,
        admin_view: isAdmin
      };
    }

    return {
      admin_view: isAdmin
    };
  }, [datasetFilter]);

  const { isFetched: isFetchedDatasets, data: datasetsList } = useGetDatasets(datasetsParams);

  return (
    <>
      <DatasetHeader datasetFilter={datasetFilter} setDatasetFilter={setDatasetFilter} />
      <DatasetListContent
        datasetsList={datasetsList}
        isFetchedDatasets={isFetchedDatasets}
        isAdmin={isAdmin}
      />
    </>
  );
}
