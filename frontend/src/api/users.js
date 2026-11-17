import { apiRequest } from './client';

export function getUsers(page = 1, size = 25) {
  const params = new URLSearchParams();
  params.set('page[number]', String(page));
  params.set('page[size]', String(size));
  return apiRequest(`/users?${params.toString()}`);
}

export function createUser(email) {
  return apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify({ user: { email } }),
  });
}
