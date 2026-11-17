import { useEffect, useState } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import { getLocations } from '../api/locations';

const FILTER_FIELDS = [
  { name: 'country_code', label: 'Country Code' },
  { name: 'state_code', label: 'State Code' },
  { name: 'city', label: 'City' },
];

const EMPTY_FILTERS = { country_code: '', state_code: '', city: '' };

function LocationsPage() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const loadLocations = async (nextPage = page, activeFilters = appliedFilters) => {
    setLoading(true);
    setError('');
    try {
      const result = await getLocations({ page: nextPage, filters: activeFilters });
      setLocations(result?.locations || []);
      setMeta(result?.meta || null);
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations(page, appliedFilters);
  }, [page, appliedFilters]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const handleClear = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
    setAppliedFilters(EMPTY_FILTERS);
  };

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4">Locations</Typography>
        <Button variant="contained" onClick={() => navigate('/locations/new')}>
          Add Location
        </Button>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <FilterBar
          fields={FILTER_FIELDS}
          values={filters}
          onChange={handleFilterChange}
          onApply={handleApply}
          onClear={handleClear}
        />
        <DataTable
          columns={[
            { field: 'city', header: 'City' },
            { field: 'state_code', header: 'State Code' },
            { field: 'country_code', header: 'Country Code' },
            {
              field: 'actions',
              header: 'Actions',
              render: (_, row) => (
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => navigate(`/locations/${row.id}`)}>View</Button>
                  <Button size="small" onClick={() => navigate(`/locations/${row.id}/edit`)}>Edit</Button>
                </Stack>
              ),
            },
          ]}
          rows={locations}
          loading={loading}
          error={error}
          emptyMessage="No locations found."
          meta={meta}
          onPageChange={setPage}
        />
      </Paper>
    </Box>
  );
}

export default LocationsPage;
