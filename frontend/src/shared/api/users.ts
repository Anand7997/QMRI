import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "./axiosClient";
import { QueryKeys } from "shared/query/keys";

export type UserApprovalStatus = "Pending" | "Approved" | "Rejected";
export type UserStatusFilter = UserApprovalStatus | "all";
export type ApprovalRoleCode = "USER" | "ADMIN" | "GUEST";
export type ApprovalCategoryCode = "Fresher" | "Digital" | "Ai" | "QE" | "Delevery" | "Guest" | "Client";

export interface UserAccessRequest {
  userId: string;
  fullName: string;
  userName: string;
  email: string;
  requestedRoleCode: ApprovalRoleCode | string;
  category: ApprovalCategoryCode | string;
  approvalStatus: UserApprovalStatus;
  isActive: boolean;
  requestedAtUtc: string;
  createdAtUtc: string;
  approvedAtUtc?: string | null;
  approvedByUserId?: string | null;
  identityAccessExpiresAtUtc?: string | null;
  identityLinkExpiresAtUtc?: string | null;
  roles: string[];
}

export interface ApproveUserInput {
  userId: string;
  roleCode?: ApprovalRoleCode;
  category?: ApprovalCategoryCode;
}

export interface ApproveUserWithIdentityLinkInput extends ApproveUserInput {
  expiresAtUtc: string;
  frontendBaseUrl?: string;
}

export interface UpdateUserAccessInput {
  userId: string;
  roleCode: ApprovalRoleCode;
  category: ApprovalCategoryCode;
  isActive: boolean;
}

export interface CreateIdentityAccessInput {
  email: string;
  expiresAtUtc: string;
}

export interface CreateIdentityLinkInput {
  fullName: string;
  email: string;
  category?: ApprovalCategoryCode;
  expiresAtUtc: string;
  frontendBaseUrl?: string;
}

export interface CreateIdentityLinkResponse {
  link: string;
  identityLinkExpiresAtUtc: string;
  user: UserAccessRequest;
}

export interface SendIdentityLinkEmailInput {
  userId: string;
  link: string;
}

export interface CreateIdentityAccessResponse {
  accessCode: string;
  identityAccessExpiresAtUtc: string;
  user: UserAccessRequest;
}

export async function getUsers(status: UserStatusFilter = "all"): Promise<UserAccessRequest[]> {
  const params = status === "all" ? undefined : { status };
  const { data } = await axiosClient.get<UserAccessRequest[]>("/users", { params });
  return data;
}

export async function approveUser(input: ApproveUserInput): Promise<UserAccessRequest> {
  const { data } = await axiosClient.post<UserAccessRequest>(`/users/${input.userId}/approve`, {
    roleCode: input.roleCode,
    category: input.category,
  });
  return data;
}

export async function approveUserWithIdentityLink(input: ApproveUserWithIdentityLinkInput): Promise<CreateIdentityLinkResponse> {
  const { data } = await axiosClient.post<CreateIdentityLinkResponse>(`/users/${input.userId}/approve-with-identity-link`, {
    roleCode: input.roleCode,
    category: input.category,
    expiresAtUtc: input.expiresAtUtc,
    frontendBaseUrl: input.frontendBaseUrl,
  });
  return data;
}

export async function createIdentityLink(input: CreateIdentityLinkInput): Promise<CreateIdentityLinkResponse> {
  const { data } = await axiosClient.post<CreateIdentityLinkResponse>("/users/identity-link", input);
  return data;
}

export async function sendIdentityLinkEmail(input: SendIdentityLinkEmailInput): Promise<void> {
  await axiosClient.post(`/users/${input.userId}/identity-link/email`, {
    link: input.link,
  });
}

export async function createIdentityAccess(input: CreateIdentityAccessInput): Promise<CreateIdentityAccessResponse> {
  const { data } = await axiosClient.post<CreateIdentityAccessResponse>("/users/identity-access", input);
  return data;
}

export function useUsers(status: UserStatusFilter = "all") {
  return useQuery({
    queryKey: [...QueryKeys.users, status],
    queryFn: () => getUsers(status),
    refetchInterval: status === "Pending" ? 15_000 : false,
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

export function useApproveUserWithIdentityLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveUserWithIdentityLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.users });
    },
  });
}

export function useCreateIdentityLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createIdentityLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.users });
    },
  });
}

export function useSendIdentityLinkEmail() {
  return useMutation({
    mutationFn: sendIdentityLinkEmail,
  });
}

export function useCreateIdentityAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createIdentityAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.users });
    },
  });
}

export function useUpdateUserAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, ...body }: UpdateUserAccessInput) =>
      axiosClient.put<UserAccessRequest>(`/users/${userId}`, body).then((response) => response.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QueryKeys.users }),
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => axiosClient.delete(`/users/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QueryKeys.users }),
  });
}
