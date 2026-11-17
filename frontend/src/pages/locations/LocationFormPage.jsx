import { useEffect, useState } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { createLocation, getLocation, updateLocation } from '../api/locations';

const initialValues = { city: '', state_code: '', country_code: '' };

function LocationFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    getLocation(id)
      .then((result) => {
        if (!active) return;
        const loc = result?.location;
        if (loc) {
          setValues({
            city: loc.city || '',
            state_code: loc.state_code || '',
            country_code: loc.country_code || '',
          });
        }
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
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await updateLocation(id, values);
        navigate(`/locations/${id}`);
      } else {
        const result = await createLocation(values);
        const newId = result?.location?.id;
        navigate(newId ? `/locations/${newId}` : '/locations');
      }
    } catch (err) {
      const details = err.data?.errors;
      setError(Array.isArray(details) ? details.join(', ') : (err.data?.error || err.message || 'Failed to save location'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEdit ? 'Edit Location' : 'New Location'}
      </Typography>
      <Paper sx={{ p: 3, maxWidth: 600 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="City"
            name="city"
            value={values.city}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="State Code"
            name="state_code"
            value={values.state_code}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            helperText="Use the carmen subregion code for the selected country (e.g. CA, MH)"
          />
          <TextField
            label="Country Code"
            name="country_code"
            value={values.country_code}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            helperText="Use ISO alpha-2 country code (e.g. US, IN)"
          />
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outlined" onClick={() => navigate(isEdit ? `/locations/${id}` : '/locations')}>
              Cancel
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

export default LocationFormPage;
