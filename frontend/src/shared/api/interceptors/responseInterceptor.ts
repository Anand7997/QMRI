import type { AxiosError, AxiosInstance } from "axios";
import { authStorage } from "shared/auth/authStorage";

export function applyResponseInterceptor(client: AxiosInstance) {
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        const requestUrl = error.config?.url ?? "";
        const isAuthRequest = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");
        const onAuthPage = window.location.pathname.startsWith("/login") || window.location.pathname.startsWith("/admin/login");

        if (!isAuthRequest) {
          authStorage.clear();
        }

        if (!isAuthRequest && !onAuthPage) {
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
