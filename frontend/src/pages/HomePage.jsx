import { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Paper, Typography } from '@mui/material';
import { getHealth } from '../api/client';

function HomePage() {
  const [status, setStatus] = useState('loading');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    getHealth()
      .then((result) => {
        if (!active) return;
        setData(result);
        setStatus('success');
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Failed to reach backend');
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Paper sx={{ p: 2, maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          Backend connectivity
        </Typography>
        {status === 'loading' && <CircularProgress size={24} />}
        {status === 'success' && (
          <Alert severity="success">
            Connected to backend: {typeof data === 'string' ? data : JSON.stringify(data)}
          </Alert>
        )}
        {status === 'error' && <Alert severity="error">{error}</Alert>}
      </Paper>
    </Box>
  );
}

export default HomePage;
