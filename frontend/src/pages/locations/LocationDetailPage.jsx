import { useEffect, useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { getLocation } from '../../api/locations';
import DetailFields from '../../components/DetailFields';
import PageHeader from '../../components/PageHeader';
import ResourceState from '../../components/ResourceState';

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

  return (
    <Box>
      <PageHeader
        title="Location Details"
        actionsBelow
        actions={[
          <Button key="back" variant="outlined" size="small" onClick={() => navigate('/locations')}>Back</Button>,
          <Button key="edit" variant="contained" size="small" onClick={() => navigate(`/locations/${id}/edit`)}>Edit</Button>,
        ]}
      />

      <ResourceState loading={loading} error={error} isEmpty={!loading && !error && !location} emptyMessage="Location not found.">
        {location && (
          <Paper sx={{ p: 3, maxWidth: 600 }}>
            <DetailFields
              fields={[
                { label: 'City', value: location.city },
                { label: 'State Code', value: location.state_code },
                { label: 'Country Code', value: location.country_code },
              ]}
            />
            <Typography sx={{ mt: 2 }} variant="body2" color="text.secondary">
              Created: {location.created_at ? new Date(location.created_at).toLocaleString() : '-'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Updated: {location.updated_at ? new Date(location.updated_at).toLocaleString() : '-'}
            </Typography>
          </Paper>
        )}
      </ResourceState>
    </Box>
  );
}

export default LocationDetailPage;
