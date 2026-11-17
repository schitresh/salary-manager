export function formatLocation(location) {
  if (!location) return '-';
  return [location.city, location.state_code, location.country_code].filter(Boolean).join(', ');
}

export function formatDepartmentOption(department) {
  if (!department) return '';
  const locationLabel = department.location
    ? [department.location.city, department.location.state_code, department.location.country_code].filter(Boolean).join(', ')
    : '';
  return locationLabel ? `${department.name} — ${locationLabel}` : department.name;
}
