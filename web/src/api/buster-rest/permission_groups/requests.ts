import { mainApi } from '../instances';
import {
  CreatePermissionGroupResponse,
  GetPermissionGroupDatasetGroupsResponse,
  GetPermissionGroupDatasetsResponse,
  GetPermissionGroupResponse,
  GetPermissionGroupUsersResponse
} from './responseInterfaces';

export const listAllPermissionGroups = async (): Promise<GetPermissionGroupResponse[]> => {
  return await mainApi
    .get<GetPermissionGroupResponse[]>(`/permission_groups`)
    .then((res) => res.data);
};

export const getPermissionGroup = async ({
  id
}: {
  id: string;
}): Promise<GetPermissionGroupResponse> => {
  return await mainApi.get(`/permission_groups/${id}`).then((res) => res.data);
};

export const updatePermissionGroups = async ({
  id,
  data
}: {
  id: string;
  data: { id: string; name: string }[];
}): Promise<void> => {
  return await mainApi.put(`/permission_groups/${id}`, data).then((res) => res.data);
};

export const deletePermissionGroup = async ({ id }: { id: string }): Promise<void> => {
  return await mainApi.delete(`/permission_groups/${id}`).then((res) => res.data);
};

export const createPermissionGroup = async ({
  name
}: {
  name: string;
}): Promise<CreatePermissionGroupResponse> => {
  return await mainApi
    .post<CreatePermissionGroupResponse>(`/permission_groups`, { name })
    .then((res) => res.data);
};

export const getPermissionGroupUsers = async ({
  id
}: {
  id: string;
}): Promise<GetPermissionGroupUsersResponse> => {
  return await mainApi.get(`/permission_groups/${id}/users`).then((res) => res.data);
};

export const getPermissionGroupDatasets = async ({
  id
}: {
  id: string;
}): Promise<GetPermissionGroupDatasetsResponse> => {
  return await mainApi.get(`/permission_groups/${id}/datasets`).then((res) => res.data);
};

export const getPermissionGroupDatasetGroups = async ({
  id
}: {
  id: string;
}): Promise<GetPermissionGroupDatasetGroupsResponse> => {
  return await mainApi.get(`/permission_groups/${id}/dataset_groups`).then((res) => res.data);
};

export const updatePermissionGroupUsers = async ({
  id,
  data
}: {
  id: string;
  data: { id: string; assigned: boolean }[];
}): Promise<void> => {
  return await mainApi.put(`/permission_groups/${id}/users`, data).then((res) => res.data);
};

export const updatePermissionGroupDatasets = async ({
  id,
  data
}: {
  id: string;
  data: { id: string; assigned: boolean }[];
}): Promise<void> => {
  return await mainApi.put(`/permission_groups/${id}/datasets`, data).then((res) => res.data);
};

export const updatePermissionGroupDatasetGroups = async ({
  id,
  data
}: {
  id: string;
  data: { id: string; assigned: boolean }[];
}): Promise<void> => {
  return await mainApi.put(`/permission_groups/${id}/dataset_groups`, data).then((res) => res.data);
};
