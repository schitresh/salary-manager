import { useEffect, useState } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import { getLocations } from '../api/locations';

function LocationsPage() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLocations = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getLocations();
      setLocations(result?.locations || []);
      setMeta(result?.meta || null);
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Locations</Typography>
        <Button variant="contained" onClick={() => navigate('/locations/new')}>
          Add Location
        </Button>
      </Stack>

      <Paper sx={{ p: 2 }}>
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
        />
      </Paper>
    </Box>
  );
}

export default LocationsPage;
