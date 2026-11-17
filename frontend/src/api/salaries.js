import { apiRequest } from './client';

export function getSalaries({ page = 1, size = 25, filters = {} } = {}) {
  const params = new URLSearchParams();
  params.set('page[number]', String(page));
  params.set('page[size]', String(size));
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(`filter[${key}]`, value);
    }
  });
  return apiRequest(`/salaries?${params.toString()}`);
}

export function getSalary(id) {
  return apiRequest(`/salaries/${id}`);
}

export function createSalary(payload) {
  return apiRequest('/salaries', {
    method: 'POST',
    body: JSON.stringify({ salary: payload }),
  });
}

export function updateSalary(id, payload) {
  return apiRequest(`/salaries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ salary: payload }),
  });
}

export function getSalaryAnalytics({ filters = {} } = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(`filter[${key}]`, value);
    }
  });
  const query = params.toString();
  return apiRequest(`/salaries/analytics${query ? `?${query}` : ''}`);
}
