import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { authStorage } from "shared/auth/authStorage";

type RefreshResponse = {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  user: NonNullable<ReturnType<typeof authStorage.getUser>>;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _qmriAuthRetry?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

function isAuthRequest(requestUrl: string) {
  return [
    "/auth/login",
    "/auth/register",
    "/auth/identity-access/login",
    "/auth/identity-link/login",
    "/auth/refresh",
  ].some((path) => requestUrl.includes(path));
}

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<RefreshResponse>("/api/v1/auth/refresh", undefined, { withCredentials: true })
      .then(({ data }) => {
        authStorage.save({
          accessToken: data.accessToken,
          accessTokenExpiresAtUtc: data.accessTokenExpiresAtUtc,
          user: data.user,
        });
        return data.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export function applyResponseInterceptor(client: AxiosInstance) {
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        const requestUrl = error.config?.url ?? "";
        const requestConfig = error.config as RetryableRequestConfig | undefined;
        const authRequest = isAuthRequest(requestUrl);

        if (requestConfig && !authRequest && !requestConfig._qmriAuthRetry) {
          const accessToken = await refreshAccessToken();

          if (accessToken) {
            requestConfig._qmriAuthRetry = true;
            requestConfig.headers.Authorization = `Bearer ${accessToken}`;
            return client.request(requestConfig);
          }
        }

        const onAuthPage = window.location.pathname.startsWith("/login") || window.location.pathname.startsWith("/admin/login");

        if (!authRequest) {
          authStorage.clear();
        }

        if (!authRequest && !onAuthPage) {
          window.location.assign("/login");
        }
      }

      // The admin user-management API requires an ADMIN role claim. A token
      // issued before an account was promoted can remain in localStorage and
      // make the already-rendered admin page look functional while every
      // mutation returns 403. Force a fresh admin login so the claim is
      // reissued instead of showing misleading operation-specific errors.
      if (error.response?.status === 403) {
        const requestUrl = error.config?.url ?? "";
        const isUserManagementRequest = requestUrl.includes("/users");
        const onAdminLoginPage = window.location.pathname.startsWith("/admin/login");

        if (isUserManagementRequest && !onAdminLoginPage) {
          authStorage.clear();
          window.location.assign("/admin/login");
        }
      }

      return Promise.reject(error);
    },
  );
}
