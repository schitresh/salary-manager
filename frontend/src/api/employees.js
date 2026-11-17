import { apiRequest } from './client';

export function getEmployees({ page = 1, size = 25, filters = {} } = {}) {
  const params = new URLSearchParams();
  params.set('page[number]', String(page));
  params.set('page[size]', String(size));
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(`filter[${key}]`, value);
    }
  });
  return apiRequest(`/employees?${params.toString()}`);
}

export function getEmployee(id) {
  return apiRequest(`/employees/${id}`);
}

export function createEmployee(payload) {
  return apiRequest('/employees', {
    method: 'POST',
    body: JSON.stringify({ employee: payload }),
  });
}

export function updateEmployee(id, payload) {
  return apiRequest(`/employees/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ employee: payload }),
  });
}
