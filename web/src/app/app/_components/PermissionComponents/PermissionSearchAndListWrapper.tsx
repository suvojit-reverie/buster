import React from 'react';
import { PermissionSearch } from './PermissionSearch';

export const PermissionSearchAndListWrapper: React.FC<{
  children: React.ReactNode;
  searchText: string;
  handleSearchChange: (text: string) => void;
  searchChildren?: React.ReactNode | React.JSX.Element;
  searchPlaceholder?: string;
}> = React.memo(
  ({ children, searchText, handleSearchChange, searchChildren, searchPlaceholder }) => {
    return (
      <div className="flex h-full flex-col space-y-3 pb-12">
        <div className="flex items-center justify-between">
          <PermissionSearch
            searchText={searchText}
            setSearchText={handleSearchChange}
            placeholder={searchPlaceholder}
          />
          {searchChildren}
        </div>
        {children}
      </div>
    );
  }
);

PermissionSearchAndListWrapper.displayName = 'PermissionSearchAndListWrapper';
