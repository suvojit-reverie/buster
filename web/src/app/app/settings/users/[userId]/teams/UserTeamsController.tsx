'use client';

import { useGetUserTeams } from '@/api/buster-rest';
import { useDebounceSearch } from '@/hooks';
import {
  NewPermissionGroupModal,
  PermissionSearchAndListWrapper
} from '@appComponents/PermissionComponents';
import React, { useMemo, useState } from 'react';
import { Button } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { AppMaterialIcons } from '@/components/icons';
import { UserTeamsListContainer } from './UserTeamsListContainer';

export const UserTeamsController: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: teams } = useGetUserTeams({ userId });
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items: teams || [],
    searchPredicate: (item, searchText) => item.name.toLowerCase().includes(searchText)
  });

  const onCloseNewTeamModal = useMemoizedFn(() => {
    setIsNewTeamModalOpen(false);
  });

  const onOpenNewTeamModal = useMemoizedFn(() => {
    setIsNewTeamModalOpen(true);
  });

  const NewTeamButton: React.ReactNode = useMemo(() => {
    return (
      <Button type="default" icon={<AppMaterialIcons icon="add" />} onClick={onOpenNewTeamModal}>
        New team
      </Button>
    );
  }, []);

  return (
    <>
      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        searchPlaceholder="Search by team name"
        searchChildren={NewTeamButton}>
        <UserTeamsListContainer filteredTeams={filteredItems} userId={userId} />
      </PermissionSearchAndListWrapper>

      <NewPermissionGroupModal
        isOpen={isNewTeamModalOpen}
        onClose={onCloseNewTeamModal}
        datasetId={null}
      />
    </>
  );
};
