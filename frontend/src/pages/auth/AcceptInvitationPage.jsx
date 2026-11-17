import { useState } from 'react';
import { Alert, Box, Button, Link, Paper, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

function AcceptInvitationPage() {
  const { acceptInvitation } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('invitation_token') || '';
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await acceptInvitation(token, password, passwordConfirmation);
      setMessage(res?.message || 'Password set successfully. You can now sign in.');
    } catch (err) {
      const details = err.data?.errors;
      setError(Array.isArray(details) ? details.join(', ') : (err.data?.error || err.message || 'Failed to accept invitation'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 420 }}>
        <Typography variant="h5" gutterBottom>Accept invitation</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Set your password to activate your HR account.
        </Typography>
        {!token && <Alert severity="warning" sx={{ mb: 2 }}>Missing invitation token.</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <TextField
            label="Confirm password"
            type="password"
            fullWidth
            margin="normal"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
          />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={loading || !token}>
            {loading ? 'Saving...' : 'Set password'}
          </Button>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Link component={RouterLink} to="/login" variant="body2">Back to sign in</Link>
        </Box>
      </Paper>
    </Box>
  );
}

export default AcceptInvitationPage;
