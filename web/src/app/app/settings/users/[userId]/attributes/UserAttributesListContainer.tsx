import { BusterUserAttribute } from '@/api/buster-rest';
import {
  BusterInfiniteList,
  BusterListColumn,
  BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/list';
import React, { useMemo } from 'react';

export const UserAttributesListContainer: React.FC<{
  filteredAttributes: BusterUserAttribute[];
  userId: string;
}> = React.memo(({ filteredAttributes, userId }) => {
  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        width: 320
      },
      {
        title: 'Value',
        dataIndex: 'value'
      }
    ],
    []
  );

  const rows: BusterListRowItem[] = useMemo(
    () =>
      filteredAttributes.map((attribute) => ({
        id: attribute.name,
        data: attribute
      })),
    [filteredAttributes]
  );

  return (
    <InfiniteListContainer
    // popupNode={
    //   <PermissionDatasetGroupSelectedPopup
    //     selectedRowKeys={selectedRowKeys}
    //     onSelectChange={setSelectedRowKeys}
    //     datasetId={datasetId}
    //   />
    // }
    >
      <BusterInfiniteList
        columns={columns}
        rows={rows}
        showHeader={true}
        showSelectAll={false}
        useRowClickSelectChange={true}
        emptyState={<EmptyStateList text="No datasets found" />}
      />
    </InfiniteListContainer>
  );
});

UserAttributesListContainer.displayName = 'UserDatasetsListContainer';
