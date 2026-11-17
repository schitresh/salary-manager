import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { getLocation } from '../api/locations';

function LocationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getLocation(id)
      .then((result) => {
        if (!active) return;
        setLocation(result?.location || null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.data?.error || err.message || 'Failed to load location');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <CircularProgress size={24} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!location) return <Alert severity="warning">Location not found.</Alert>;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Location Details</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate('/locations')}>Back</Button>
          <Button variant="contained" onClick={() => navigate(`/locations/${id}/edit`)}>Edit</Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Typography><strong>City:</strong> {location.city}</Typography>
        <Typography><strong>State Code:</strong> {location.state_code}</Typography>
        <Typography><strong>Country Code:</strong> {location.country_code}</Typography>
        <Typography sx={{ mt: 2 }} variant="body2" color="text.secondary">
          Created: {location.created_at ? new Date(location.created_at).toLocaleString() : '-'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Updated: {location.updated_at ? new Date(location.updated_at).toLocaleString() : '-'}
        </Typography>
      </Paper>
    </Box>
  );
}

export default LocationDetailPage;
