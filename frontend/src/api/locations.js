import { apiRequest } from './client';

export function getLocations({ page = 1, size = 25, filters = {} } = {}) {
  const params = new URLSearchParams();
  params.set('page[number]', String(page));
  params.set('page[size]', String(size));
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(`filter[${key}]`, value);
    }
  });
  return apiRequest(`/locations?${params.toString()}`);
}

export function getLocation(id) {
  return apiRequest(`/locations/${id}`);
}

export function createLocation(payload) {
  return apiRequest('/locations', {
    method: 'POST',
    body: JSON.stringify({ location: payload }),
  });
}

export function updateLocation(id, payload) {
  return apiRequest(`/locations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ location: payload }),
  });
}
