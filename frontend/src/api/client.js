import { clearAuth, getToken } from '../auth/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1';

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const authHeader = response.headers.get('Authorization');
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (response.status === 401) {
    clearAuth();
    if (onUnauthorized) onUnauthorized();
  }

  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'API request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  if (headerToken) {
    return { data, token: headerToken };
  }

  return data;
}

export function getHealth() {
  return apiRequest('/health');
}

export async function signIn(email, password) {
  const result = await apiRequest('/auth/sign_in', {
    method: 'POST',
    body: JSON.stringify({ user: { email, password } }),
  });
  const payload = result?.token ? result.data : result;
  const token = result?.token || payload?.token;
  return { user: payload?.user, token };
}

export function signOut() {
  return apiRequest('/auth/sign_out', { method: 'DELETE' });
}

export function requestPasswordReset(email) {
  return apiRequest('/auth/password', {
    method: 'POST',
    body: JSON.stringify({ user: { email } }),
  });
}

export function resetPassword(reset_password_token, password, password_confirmation) {
  return apiRequest('/auth/password', {
    method: 'PATCH',
    body: JSON.stringify({ user: { reset_password_token, password, password_confirmation } }),
  });
}

export function acceptInvitation(invitation_token, password, password_confirmation) {
  return apiRequest('/auth/invitation', {
    method: 'PUT',
    body: JSON.stringify({ user: { invitation_token, password, password_confirmation } }),
  });
}
