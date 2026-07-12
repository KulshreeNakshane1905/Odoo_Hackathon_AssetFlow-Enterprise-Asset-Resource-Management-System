import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Button, TextField, Typography, 
  Select, MenuItem, FormControl, Link, Alert, CircularProgress, 
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// Classy dark input styling styles (no notched fieldsets)
const inputStyles = {
  color: '#f8fafc',
  bgcolor: 'rgba(15, 23, 42, 0.45)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  transition: 'all 0.2s ease-in-out',
  '& fieldset': { border: 'none' },
  '& input': {
    py: 1.6,
    px: 2,
    fontSize: '0.92rem'
  },
  '&:hover': {
    border: '1px solid rgba(255, 255, 255, 0.16)',
    bgcolor: 'rgba(15, 23, 42, 0.55)'
  },
  '&.Mui-focused': {
    border: '1px solid #3b82f6',
    bgcolor: 'rgba(15, 23, 42, 0.7)',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.25)'
  }
};

const labelStyles = {
  color: '#94a3b8', 
  fontWeight: 700, 
  mb: 1, 
  textTransform: 'uppercase', 
  letterSpacing: 0.8, 
  fontSize: '0.72rem',
  display: 'block', 
  alignSelf: 'flex-start'
};

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

  const handleTabChange = (val: number) => {
    setTabVal(val);
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
        background: 'radial-gradient(circle at center, #111b2e 0%, #060913 100%)',
        position: 'relative',
        overflow: 'hidden',
        px: 2
      }}
    >
      {/* Soft blurred glowing backdrop elements */}
      <Box 
        sx={{ 
          position: 'absolute', 
          width: 500, 
          height: 500, 
          borderRadius: '50%', 
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.16) 0%, rgba(37, 99, 235, 0) 70%)',
          top: '-10%', 
          left: '-10%',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }} 
      />
      <Box 
        sx={{ 
          position: 'absolute', 
          width: 500, 
          height: 500, 
          borderRadius: '50%', 
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0) 70%)',
          bottom: '-10%', 
          right: '-10%',
          filter: 'blur(80px)',
          pointerEvents: 'none'
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
            borderRadius: 6,
            border: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)'
          }}
        >
          <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* Logo */}
            <Box 
              sx={{ 
                width: 54, 
                height: 54, 
                borderRadius: '14px', 
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)',
                mb: 2
              }}
            >
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 850, letterSpacing: 1 }}>
                AF
              </Typography>
            </Box>

            <Typography variant="h5" color="text.primary" sx={{ fontWeight: 800, letterSpacing: -0.5, mb: 0.5 }}>
              AssetFlow ERP
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
              Enterprise Asset & Resource Management
            </Typography>

            {/* Custom rounded Segmented pill Tabs (Redesigned completely to look clean & premium) */}
            <Box sx={{ display: 'flex', width: '100%', bgcolor: 'rgba(15, 23, 42, 0.45)', p: 0.5, borderRadius: '12px', mb: 3.5, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <Button 
                fullWidth 
                onClick={() => handleTabChange(0)}
                sx={{
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 'bold',
                  borderRadius: '10px',
                  color: tabVal === 0 ? '#3b82f6' : '#64748b',
                  bgcolor: tabVal === 0 ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  border: tabVal === 0 ? '1px solid rgba(59, 130, 246, 0.15)' : '1px solid transparent',
                  transition: 'all 0.2s',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: tabVal === 0 ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    transform: 'none'
                  }
                }}
              >
                Sign In
              </Button>
              <Button 
                fullWidth 
                onClick={() => handleTabChange(1)}
                sx={{
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 'bold',
                  borderRadius: '10px',
                  color: tabVal === 1 ? '#3b82f6' : '#64748b',
                  bgcolor: tabVal === 1 ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  border: tabVal === 1 ? '1px solid rgba(59, 130, 246, 0.15)' : '1px solid transparent',
                  transition: 'all 0.2s',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: tabVal === 1 ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    transform: 'none'
                  }
                }}
              >
                Sign Up
              </Button>
            </Box>

            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%' }}>
                  <Alert severity="error" sx={{ width: '100%', mb: 2.5, borderRadius: '12px' }}>{errorMsg}</Alert>
                </motion.div>
              )}

              {successMsg && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%' }}>
                  <Alert severity="success" sx={{ width: '100%', mb: 2.5, borderRadius: '12px' }}>{successMsg}</Alert>
                </motion.div>
              )}

              {tabVal === 0 ? (
                // --- LOGIN SCREEN ---
                <motion.form 
                  key="login"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  style={{ width: '100%' }}
                  onSubmit={handleLogin}
                >
                  <Typography sx={labelStyles}>Email Address</Typography>
                  <TextField 
                    fullWidth 
                    variant="outlined" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{ sx: inputStyles }}
                    placeholder="name@company.com"
                    sx={{ mb: 2.5 }}
                  />

                  <Typography sx={labelStyles}>Password</Typography>
                  <TextField 
                    fullWidth 
                    variant="outlined" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{ sx: inputStyles }}
                    placeholder="••••••••"
                    sx={{ mb: 1.5 }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3.5 }}>
                    <Link 
                      component="button" 
                      type="button"
                      variant="body2" 
                      onClick={() => setForgotDialogOpen(true)}
                      sx={{ textDecoration: 'none', color: 'primary.main', fontWeight: 'bold', fontSize: '0.8rem' }}
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
                      borderRadius: 3, 
                      py: 1.6,
                      fontWeight: 'bold',
                      textTransform: 'none',
                      fontSize: '0.95rem',
                      boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        boxShadow: '0 10px 28px rgba(37, 99, 235, 0.45)',
                      }
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
                  </Button>
                </motion.form>
              ) : (
                // --- SIGNUP SCREEN ---
                <motion.form 
                  key="signup"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  style={{ width: '100%' }}
                  onSubmit={handleSignup}
                >
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={labelStyles}>First Name</Typography>
                      <TextField 
                        fullWidth 
                        variant="outlined"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        InputProps={{ sx: inputStyles }}
                        placeholder="John"
                        sx={{ mb: 2.5 }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={labelStyles}>Last Name</Typography>
                      <TextField 
                        fullWidth 
                        variant="outlined"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        InputProps={{ sx: inputStyles }}
                        placeholder="Doe"
                        sx={{ mb: 2.5 }}
                      />
                    </Box>
                  </Box>

                  <Typography sx={labelStyles}>Email Address</Typography>
                  <TextField 
                    fullWidth 
                    variant="outlined" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{ sx: inputStyles }}
                    placeholder="name@company.com"
                    sx={{ mb: 2.5 }}
                  />

                  <Typography sx={labelStyles}>Password</Typography>
                  <TextField 
                    fullWidth 
                    variant="outlined" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{ sx: inputStyles }}
                    placeholder="••••••••"
                    sx={{ mb: 2.5 }}
                  />

                  <Typography sx={labelStyles}>Department</Typography>
                  <FormControl fullWidth sx={{ mb: 3.5 }}>
                    <Select
                      value={deptId}
                      onChange={(e) => setDeptId(e.target.value)}
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected) {
                          return <span style={{ color: '#64748b' }}>Select department</span>;
                        }
                        const dept = departments.find(d => d.id === selected);
                        return dept ? `${dept.name} (${dept.code})` : '';
                      }}
                      sx={{
                        color: '#f8fafc',
                        bgcolor: 'rgba(15, 23, 42, 0.45)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        transition: 'all 0.2s ease-in-out',
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '& .MuiSelect-select': {
                          py: 1.6,
                          px: 2,
                          fontSize: '0.92rem'
                        },
                        '&:hover': {
                          border: '1px solid rgba(255, 255, 255, 0.16)',
                          bgcolor: 'rgba(15, 23, 42, 0.55)'
                        },
                        '&.Mui-focused': {
                          border: '1px solid #3b82f6',
                          bgcolor: 'rgba(15, 23, 42, 0.7)',
                          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.25)'
                        }
                      }}
                    >
                      <MenuItem disabled value="">
                        <span style={{ color: '#64748b' }}>Select department</span>
                      </MenuItem>
                      {departments.map((d) => (
                        <MenuItem key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Alert severity="info" sx={{ mb: 3.5, borderRadius: '12px', fontSize: '0.78rem' }}>
                    <strong>Note:</strong> Signup registers a standard <strong>Employee</strong> account. Elevated Admin/Manager scopes are assigned via administration.
                  </Alert>

                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="primary" 
                    size="large"
                    type="submit"
                    disabled={loading}
                    sx={{ 
                      borderRadius: 3, 
                      py: 1.6,
                      fontWeight: 'bold',
                      textTransform: 'none',
                      fontSize: '0.95rem',
                      boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        boxShadow: '0 10px 28px rgba(37, 99, 235, 0.45)',
                      }
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
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 4,
            color: 'text.primary',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', pt: 3, px: 3 }}>Reset Password</DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <DialogContentText sx={{ color: 'text.secondary', mb: 2.5, fontSize: '0.88rem' }}>
            Enter your email address and we'll send you instructions to reset your password.
          </DialogContentText>
          <Typography sx={labelStyles}>Email Address</Typography>
          <TextField
            autoFocus
            margin="dense"
            type="email"
            fullWidth
            variant="outlined"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            InputProps={{ sx: inputStyles }}
            placeholder="name@company.com"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button onClick={() => setForgotDialogOpen(false)} sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleForgotPasswordSubmit} 
            variant="contained" 
            disabled={forgotLoading || !forgotEmail}
            sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}
          >
            {forgotLoading ? <CircularProgress size={20} color="inherit" /> : 'Send Instructions'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuthPage;
