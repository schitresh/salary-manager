import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import { getDepartments } from '../../api/departments';
import { getLocations } from '../../api/locations';
import { getSalaryAnalytics } from '../../api/salaries';

const EMPTY_FILTERS = {
  department_id: '',
  location_id: '',
  city: '',
  state_code: '',
  job_title: '',
};

function formatLocation(location) {
  if (!location) return '-';
  return [location.city, location.state_code, location.country_code].filter(Boolean).join(', ');
}

function StatCard({ label, value }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h5">{value ?? '-'}</Typography>
      </CardContent>
    </Card>
  );
}

function AnalyticsPage() {
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasQueried, setHasQueried] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      getDepartments({ page: 1, size: 100 }).catch(() => ({ departments: [] })),
      getLocations({ page: 1, size: 100 }).catch(() => ({ locations: [] })),
    ]).then(([deptRes, locRes]) => {
      if (!active) return;
      setDepartments(deptRes?.departments || []);
      setLocations(locRes?.locations || []);
    });
    return () => { active = false; };
  }, []);

  const handleChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const runAnalytics = async (activeFilters = filters) => {
    setLoading(true);
    setError('');
    setHasQueried(true);
    try {
      const result = await getSalaryAnalytics({ filters: activeFilters });
      setAnalytics(result?.analytics || null);
    } catch (err) {
      setAnalytics(null);
      setError(err.data?.error || err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e?.preventDefault();
    await runAnalytics(filters);
  };

  const handleClear = async () => {
    setFilters(EMPTY_FILTERS);
    setAnalytics(null);
    setError('');
    setHasQueried(false);
  };

  const departmentOptions = useMemo(
    () => departments.map((d) => ({ value: String(d.id), label: d.name })),
    [departments]
  );
  const locationOptions = useMemo(
    () => locations.map((l) => ({ value: String(l.id), label: formatLocation(l) })),
    [locations]
  );

  const isEmptyResult = analytics && analytics.count === 0;

  return (
    <Box>
      <PageHeader title="Analytics" />

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box component="form" onSubmit={handleApply}>
          <Stack spacing={2}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, minmax(220px, 1fr))' },
                gap: 2,
              }}
            >
              <FormControl fullWidth>
                <InputLabel id="analytics-department-label">Department</InputLabel>
                <Select
                  labelId="analytics-department-label"
                  label="Department"
                  value={filters.department_id}
                  onChange={(e) => handleChange('department_id', e.target.value)}
                >
                  <MenuItem value="">All departments</MenuItem>
                  {departmentOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="analytics-location-label">Location</InputLabel>
                <Select
                  labelId="analytics-location-label"
                  label="Location"
                  value={filters.location_id}
                  onChange={(e) => handleChange('location_id', e.target.value)}
                >
                  <MenuItem value="">All locations</MenuItem>
                  {locationOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="City"
                value={filters.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
              <TextField
                fullWidth
                label="State Code"
                value={filters.state_code}
                onChange={(e) => handleChange('state_code', e.target.value)}
              />
              <TextField
                fullWidth
                label="Job Title"
                value={filters.job_title}
                onChange={(e) => handleChange('job_title', e.target.value)}
              />
            </Box>
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Loading...' : 'Apply'}
              </Button>
              <Button type="button" variant="outlined" onClick={handleClear} disabled={loading}>
                Clear
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!error && hasQueried && isEmptyResult && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No current salaries match the selected filters.
        </Alert>
      )}

      {!error && analytics && analytics.count > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Results for current salaries ({analytics.currency}) — {analytics.count} record{analytics.count === 1 ? '' : 's'}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, minmax(180px, 1fr))' },
              gap: 2,
            }}
          >
            <StatCard label="Count" value={analytics.count} />
            <StatCard label="Total" value={`${analytics.currency} ${analytics.total}`} />
            <StatCard label="Average" value={analytics.average != null ? `${analytics.currency} ${analytics.average}` : '-'} />
            <StatCard label="Median" value={analytics.median != null ? `${analytics.currency} ${analytics.median}` : '-'} />
          </Box>
        </Box>
      )}

      {!error && !hasQueried && (
        <Alert severity="info">
          Select filters and click Apply to view analytics for current applicable salaries.
        </Alert>
      )}
    </Box>
  );
}

export default AnalyticsPage;
