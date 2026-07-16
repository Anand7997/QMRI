import { axiosClient } from "./axiosClient";
import type { AuthUser } from "shared/auth/authStorage";

export interface LoginRequest {
  userNameOrEmail: string;
  password: string;
}

export interface IdentityLinkLoginRequest {
  token: string;
}
export interface IdentityAccessLoginRequest {
  email: string;
  accessCode: string;
}

export interface LoginResponse {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: {
    token: string;
    expiresAtUtc: string;
  };
  user: AuthUser;
}

export interface RegisterRequest {
  fullName: string;
  userName: string;
  email: string;
  password: string;
  requestedRole: "USER" | "ADMIN";
}

export interface RegisterResponse {
  userId: string;
  fullName: string;
  userName: string;
  email: string;
  requestedRoleCode: string;
  approvalStatus: "Pending" | "Approved" | "Rejected";
  message: string;
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const { data } = await axiosClient.post<LoginResponse>("/auth/login", request);
  return data;
}

export async function loginWithIdentityAccess(request: IdentityAccessLoginRequest): Promise<LoginResponse> {
  const { data } = await axiosClient.post<LoginResponse>("/auth/identity-access/login", request);
  return data;
}

export async function loginWithIdentityLink(request: IdentityLinkLoginRequest): Promise<LoginResponse> {
  const { data } = await axiosClient.post<LoginResponse>("/auth/identity-link/login", request);
  return data;
}
export async function register(request: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await axiosClient.post<RegisterResponse>("/auth/register", request);
  return data;
}
