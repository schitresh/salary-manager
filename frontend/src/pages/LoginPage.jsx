import { useState } from 'react';
import { Alert, Box, Button, Link, Paper, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 420 }}>
        <Typography variant="h5" gutterBottom>Sign in</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          HR Salary Manager
        </Typography>

        {import.meta.env.DEV && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Dev login: <strong>hr@official.com</strong> / <strong>Password123!</strong>
          </Alert>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Link component={RouterLink} to="/password/forgot" variant="body2">
            Forgot password?
          </Link>
        </Box>
      </Paper>
    </Box>
  );
}

export default LoginPage;
