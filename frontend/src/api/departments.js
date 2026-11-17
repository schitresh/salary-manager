import { apiRequest } from './client';

export function getDepartments({ page = 1, size = 25, filters = {} } = {}) {
  const params = new URLSearchParams();
  params.set('page[number]', String(page));
  params.set('page[size]', String(size));
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(`filter[${key}]`, value);
    }
  });
  return apiRequest(`/departments?${params.toString()}`);
}

export function getDepartment(id) {
  return apiRequest(`/departments/${id}`);
}

export function createDepartment(payload) {
  return apiRequest('/departments', {
    method: 'POST',
    body: JSON.stringify({ department: payload }),
  });
}

export function updateDepartment(id, payload) {
  return apiRequest(`/departments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ department: payload }),
  });
}
