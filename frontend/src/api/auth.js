import { apiRequest } from './client';

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
