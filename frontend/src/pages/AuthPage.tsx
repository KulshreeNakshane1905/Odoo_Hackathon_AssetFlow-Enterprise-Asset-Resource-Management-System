import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Button, TextField, Typography, 
  Select, MenuItem, FormControl, InputLabel, Tabs, Tab, 
  Link, Alert, CircularProgress, Dialog, DialogTitle, 
  DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const AuthPage: React.FC = () => {
  const { login, signup, forgotPassword } = useAuth();
  const [tabVal, setTabVal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [deptId, setDeptId] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);

  // Forgot password dialog
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    // Load departments
    const loadDepts = async () => {
      try {
        const data = await api.getDepartments();
        setDepartments(data);
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    };
    loadDepts();
  }, []);

  const handleTabChange = (_: any, newValue: number) => {
    setTabVal(newValue);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !deptId) {
      setErrorMsg('Please complete all required fields.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await signup({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        department_id: deptId
      });
      setSuccessMsg('Account created successfully! Logging you in...');
    } catch (err: any) {
      setErrorMsg(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async () => {
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      const msg = await forgotPassword(forgotEmail);
      setSuccessMsg(msg);
      setForgotDialogOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Password reset failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        position: 'relative',
        overflow: 'hidden',
        px: 2
      }}
    >
      {/* Decorative blurred circles for background aesthetics */}
      <Box 
        sx={{ 
          position: 'absolute', 
          width: 300, 
          height: 300, 
          borderRadius: '50%', 
          bg: 'primary.main', 
          background: 'radial-gradient(circle, #3b82f6 0%, rgba(59,130,246,0) 70%)',
          top: '10%', 
          left: '10%',
          filter: 'blur(40px)',
          opacity: 0.4
        }} 
      />
      <Box 
        sx={{ 
          position: 'absolute', 
          width: 350, 
          height: 350, 
          borderRadius: '50%', 
          background: 'radial-gradient(circle, #ec4899 0%, rgba(236,72,153,0) 70%)',
          bottom: '10%', 
          right: '10%',
          filter: 'blur(50px)',
          opacity: 0.3
        }} 
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card 
          sx={{ 
            width: '100%',
            maxWidth: 440,
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
          }}
        >
          <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* Logo */}
            <Box 
              sx={{ 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                bgcolor: 'primary.main', 
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                mb: 2
              }}
            >
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold', letterSpacing: 1 }}>
                AF
              </Typography>
            </Box>

            <Typography variant="h5" color="text.primary" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              AssetFlow
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 3 }}>
              Enterprise Asset & Resource Management
            </Typography>

            <Box sx={{ width: '100%', mb: 3 }}>
              <Tabs 
                value={tabVal} 
                onChange={handleTabChange} 
                variant="fullWidth"
                textColor="primary"
                indicatorColor="primary"
                sx={{
                  '& .MuiTab-root': { color: 'text.secondary', fontWeight: 'bold' },
                  '& .Mui-selected': { color: 'primary.main' }
                }}
              >
                <Tab label="Sign In" />
                <Tab label="Sign Up" />
              </Tabs>
            </Box>

            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%' }}>
                  <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 2 }}>{errorMsg}</Alert>
                </motion.div>
              )}

              {successMsg && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%' }}>
                  <Alert severity="success" sx={{ width: '100%', mb: 2, borderRadius: 2 }}>{successMsg}</Alert>
                </motion.div>
              )}

              {tabVal === 0 ? (
                // --- LOGIN SCREEN ---
                <motion.form 
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  style={{ width: '100%' }}
                  onSubmit={handleLogin}
                >
                  <TextField 
                    fullWidth 
                    label="Email Address" 
                    variant="outlined" 
                    margin="normal"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{ input: { color: 'text.primary' } }}
                    placeholder="name@company.com"
                  />
                  <TextField 
                    fullWidth 
                    label="Password" 
                    variant="outlined" 
                    margin="normal"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ input: { color: 'text.primary' } }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 3 }}>
                    <Link 
                      component="button" 
                      type="button"
                      variant="body2" 
                      onClick={() => setForgotDialogOpen(true)}
                      sx={{ textDecoration: 'none', color: 'primary.main', fontWeight: 'bold' }}
                    >
                      Forgot password?
                    </Link>
                  </Box>

                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="primary" 
                    size="large"
                    type="submit"
                    disabled={loading}
                    sx={{ 
                      borderRadius: 2, 
                      py: 1.5,
                      fontWeight: 'bold',
                      textTransform: 'none',
                      fontSize: '1rem',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
                  </Button>
                </motion.form>
              ) : (
                // --- SIGNUP SCREEN ---
                <motion.form 
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ width: '100%' }}
                  onSubmit={handleSignup}
                >
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <TextField 
                      fullWidth 
                      label="First Name" 
                      variant="outlined"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      sx={{ input: { color: 'text.primary' } }}
                    />
                    <TextField 
                      fullWidth 
                      label="Last Name" 
                      variant="outlined"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      sx={{ input: { color: 'text.primary' } }}
                    />
                  </Box>
                  <TextField 
                    fullWidth 
                    label="Email Address" 
                    variant="outlined" 
                    margin="normal"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{ input: { color: 'text.primary' } }}
                  />
                  <TextField 
                    fullWidth 
                    label="Password" 
                    variant="outlined" 
                    margin="normal"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ input: { color: 'text.primary' } }}
                  />

                  <FormControl fullWidth margin="normal">
                    <InputLabel id="dept-label">Department</InputLabel>
                    <Select
                      labelId="dept-label"
                      value={deptId}
                      label="Department"
                      onChange={(e) => setDeptId(e.target.value)}
                      sx={{ color: 'text.primary' }}
                    >
                      {departments.map((d) => (
                        <MenuItem key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Alert severity="info" sx={{ mt: 2, mb: 3, borderRadius: 2, fontSize: '0.8rem' }}>
                    <strong>Note:</strong> Signup creates a standard <strong>Employee</strong> account. Admin/Manager roles must be assigned later by an system administrator.
                  </Alert>

                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="primary" 
                    size="large"
                    type="submit"
                    disabled={loading}
                    sx={{ 
                      borderRadius: 2, 
                      py: 1.5,
                      fontWeight: 'bold',
                      textTransform: 'none',
                      fontSize: '1rem',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

          </CardContent>
        </Card>
      </motion.div>

      {/* Forgot Password Dialog */}
      <Dialog 
        open={forgotDialogOpen} 
        onClose={() => setForgotDialogOpen(false)}
        PaperProps={{
          sx: {
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 3,
            color: 'text.primary'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Reset Password</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary', mb: 2 }}>
            Enter your email address and we'll send you instructions to reset your password.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            sx={{ input: { color: 'text.primary' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setForgotDialogOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleForgotPasswordSubmit} 
            variant="contained" 
            disabled={forgotLoading || !forgotEmail}
          >
            {forgotLoading ? <CircularProgress size={20} color="inherit" /> : 'Send Instructions'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
