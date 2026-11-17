import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { createUser, getUsers } from '../api/client';

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviting, setInviting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getUsers();
      setUsers(result?.users || []);
      setMeta(result?.meta || null);
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteMessage('');
    setInviteError('');
    setInviting(true);
    try {
      await createUser(inviteEmail);
      setInviteMessage(`Invitation sent to ${inviteEmail}.`);
      setInviteEmail('');
      await loadUsers();
    } catch (err) {
      const details = err.data?.errors;
      setInviteError(Array.isArray(details) ? details.join(', ') : (err.data?.error || err.message || 'Failed to invite user'));
    } finally {
      setInviting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        HR Users
      </Typography>

      <Paper sx={{ p: 2, mb: 3, maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          Invite HR team member
        </Typography>
        {inviteMessage && <Alert severity="success" sx={{ mb: 2 }}>{inviteMessage}</Alert>}
        {inviteError && <Alert severity="error" sx={{ mb: 2 }}>{inviteError}</Alert>}
        <Box component="form" onSubmit={handleInvite} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            label="Official email"
            type="email"
            size="small"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            fullWidth
            helperText="Must end with @official.com"
          />
          <Button type="submit" variant="contained" disabled={inviting} sx={{ mt: 0.5 }}>
            {inviting ? 'Inviting...' : 'Invite'}
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Users
        </Typography>
        {loading && <CircularProgress size={24} />}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.id}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3}>No users found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {meta && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Total: {meta.total}
              </Typography>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}

export default UsersPage;
