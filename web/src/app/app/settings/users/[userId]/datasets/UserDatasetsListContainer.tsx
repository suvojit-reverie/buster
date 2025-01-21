import {
  BusterUserDataset,
  BusterUserDatasetGroup,
  useUpdateUserDatasetGroups,
  type BusterUserPermissionGroup
} from '@/api/buster-rest';
import { PermissionAssignedCell } from '@/app/app/_components/PermissionComponents';
import {
  BusterInfiniteList,
  BusterListColumn,
  BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/list';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useMemoizedFn } from 'ahooks';
import React, { useMemo, useState } from 'react';

export const UserDatasetsListContainer: React.FC<{
  filteredDatasets: BusterUserDataset[];
  userId: string;
}> = React.memo(({ filteredDatasets, userId }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { mutateAsync: updateUserDatasetGroups } = useUpdateUserDatasetGroups({
    userId: userId
  });

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    await updateUserDatasetGroups([params]);
  });

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        width: 270
      },
      {
        title: 'Assigned',
        dataIndex: 'assigned',
        render: (assigned: boolean, permissionGroup: BusterUserPermissionGroup) => {
          return (
            <div className="flex justify-end">
              <PermissionAssignedCell
                id={permissionGroup.id}
                assigned={assigned}
                text="assigned"
                onSelect={onSelectAssigned}
              />
            </div>
          );
        }
      }
    ],
    []
  );

  const { cannotQueryPermissionUsers, canQueryPermissionUsers } = useMemo(() => {
    const result: {
      cannotQueryPermissionUsers: BusterListRowItem[];
      canQueryPermissionUsers: BusterListRowItem[];
    } = filteredDatasets.reduce<{
      cannotQueryPermissionUsers: BusterListRowItem[];
      canQueryPermissionUsers: BusterListRowItem[];
    }>(
      (acc, dataset) => {
        const user: BusterListRowItem = {
          id: dataset.id,
          data: dataset,
          link: createBusterRoute({
            route: BusterRoutes.APP_SETTINGS_USERS_ID,
            userId: dataset.id
          })
        };
        if (dataset.assigned) {
          acc.canQueryPermissionUsers.push(user);
        } else {
          acc.cannotQueryPermissionUsers.push(user);
        }
        return acc;
      },
      {
        cannotQueryPermissionUsers: [] as BusterListRowItem[],
        canQueryPermissionUsers: [] as BusterListRowItem[]
      }
    );
    return result;
  }, [filteredDatasets]);

  const rows = useMemo(
    () =>
      [
        {
          id: 'header-assigned',
          data: {},
          hidden: canQueryPermissionUsers.length === 0,
          rowSection: {
            title: 'Assigned',
            secondaryTitle: canQueryPermissionUsers.length.toString()
          }
        },
        ...canQueryPermissionUsers,
        {
          id: 'header-not-assigned',
          data: {},
          hidden: cannotQueryPermissionUsers.length === 0,
          rowSection: {
            title: 'Not Assigned',
            secondaryTitle: cannotQueryPermissionUsers.length.toString()
          }
        },
        ...cannotQueryPermissionUsers
      ].filter((row) => !(row as any).hidden),
    [canQueryPermissionUsers, cannotQueryPermissionUsers]
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
        showHeader={false}
        showSelectAll={false}
        useRowClickSelectChange={true}
        selectedRowKeys={selectedRowKeys}
        onSelectChange={setSelectedRowKeys}
        emptyState={<EmptyStateList text="No datasets found" />}
      />
    </InfiniteListContainer>
  );
});

UserDatasetsListContainer.displayName = 'UserDatasetsListContainer';
