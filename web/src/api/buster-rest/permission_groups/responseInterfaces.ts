export interface GetPermissionGroupResponse {
  created_at: string;
  created_by: string;
  id: string;
  name: string;
  organization_id: string;
  updated_at: string;
  updated_by: string; //THIS IS THE USER ID
}

export interface CreatePermissionGroupResponse extends GetPermissionGroupResponse {}

export interface GetPermissionGroupUsersResponse {
  id: string;
  assigned: boolean;
}

export interface GetPermissionGroupDatasetsResponse {
  id: string;
  assigned: boolean;
}

export interface GetPermissionGroupDatasetGroupsResponse {
  id: string;
  assigned: boolean;
}
