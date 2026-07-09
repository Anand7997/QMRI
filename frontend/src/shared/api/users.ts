import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "./axiosClient";
import { QueryKeys } from "shared/query/keys";

export type UserApprovalStatus = "Pending" | "Approved" | "Rejected";
export type UserStatusFilter = UserApprovalStatus | "all";
export type ApprovalRoleCode = "USER" | "ADMIN";

export interface UserAccessRequest {
  userId: string;
  fullName: string;
  userName: string;
  email: string;
  requestedRoleCode: ApprovalRoleCode | string;
  approvalStatus: UserApprovalStatus;
  isActive: boolean;
  requestedAtUtc: string;
  createdAtUtc: string;
  approvedAtUtc?: string | null;
  approvedByUserId?: string | null;
  roles: string[];
}

export interface ApproveUserInput {
  userId: string;
  roleCode?: ApprovalRoleCode;
}

export async function getUsers(status: UserStatusFilter = "all"): Promise<UserAccessRequest[]> {
  const params = status === "all" ? undefined : { status };
  const { data } = await axiosClient.get<UserAccessRequest[]>("/users", { params });
  return data;
}

export async function approveUser(input: ApproveUserInput): Promise<UserAccessRequest> {
  const { data } = await axiosClient.post<UserAccessRequest>(`/users/${input.userId}/approve`, {
    roleCode: input.roleCode,
  });
  return data;
}

export function useUsers(status: UserStatusFilter = "all") {
  return useQuery({
    queryKey: [...QueryKeys.users, status],
    queryFn: () => getUsers(status),
  });
}

export function useApproveUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.users });
    },
  });
}
