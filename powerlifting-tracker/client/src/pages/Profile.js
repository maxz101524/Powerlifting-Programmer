import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Grid,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { FitnessCenter as FitnessCenterIcon } from '@mui/icons-material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [userStats, setUserStats] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await axios.get('/api/workouts/analytics/summary');
        setUserStats({
          totalWorkouts: response.data.totalWorkouts || 0,
          favoriteExercise: Object.keys(response.data.exerciseData || {}).sort(
            (a, b) => response.data.exerciseData[b].totalVolume - response.data.exerciseData[a].totalVolume
          )[0] || 'N/A',
          totalVolume: Object.values(response.data.exerciseData || {}).reduce(
            (sum, ex) => sum + ex.totalVolume, 0
          ),
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    if (user) {
      fetchUserStats();
      reset({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [user, reset]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    reset({
      name: user.name || '',
      email: user.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleUpdateProfile = async (data) => {
    try {
      setIsLoading(true);
      
      // Only include fields that have changed
      const updateData = {};
      if (data.name !== user.name) updateData.name = data.name;
      if (data.email !== user.email) updateData.email = data.email;
      
      if (Object.keys(updateData).length > 0) {
        await updateUser(updateData);
        setSnackbar({
          open: true,
          message: 'Profile updated successfully!',
          severity: 'success',
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update profile',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'New passwords do not match',
        severity: 'error',
      });
      return;
    }

    try {
      setIsLoading(true);
      await axios.put('/api/auth/update-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      
      setSnackbar({
        open: true,
        message: 'Password updated successfully!',
        severity: 'success',
      });
      
      // Clear password fields
      reset({
        ...data,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update password',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowNewPassword = () => {
    setShowNewPassword(!showNewPassword);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.')) {
      try {
        setIsLoading(true);
        await axios.delete('/api/auth/delete-account');
        logout();
      } catch (error) {
        console.error('Error deleting account:', error);
        setSnackbar({
          open: true,
          message: 'Failed to delete account. Please try again.',
          severity: 'error',
        });
        setIsLoading(false);
      }
    }
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Profile
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your account settings and preferences
        </Typography>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="profile tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Profile" />
            <Tab label="Security" />
            <Tab label="Statistics" />
          </Tabs>
        </Box>

        <CardContent>
          {activeTab === 0 && (
            <form onSubmit={handleSubmit(handleUpdateProfile)}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                    <Avatar
                      sx={{
                        width: 120,
                        height: 120,
                        fontSize: 48,
                        mb: 2,
                        bgcolor: 'primary.main',
                      }}
                    >
                      {user?.name?.charAt(0) || 'U'}
                    </Avatar>
                    <Typography variant="h6">{user?.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {user?.email}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Name"
                        variant="outlined"
                        {...register('name', { required: 'Name is required' })}
                        error={!!errors.name}
                        helperText={errors.name?.message}
                        disabled={!isEditing || isLoading}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        variant="outlined"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                          },
                        })}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        disabled={!isEditing || isLoading}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      {isEditing ? (
                        <Box display="flex" gap={2} mt={2}>
                          <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={isLoading}
                          >
                            {isLoading ? <CircularProgress size={24} /> : 'Save Changes'}
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={handleCancelEdit}
                            disabled={isLoading}
                          >
                            Cancel
                          </Button>
                        </Box>
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleEditProfile}
                        >
                          Edit Profile
                        </Button>
                      )}
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </form>
          )}

          {activeTab === 1 && (
            <Box maxWidth={600} mx="auto">
              <form onSubmit={handleSubmit(handleUpdatePassword)}>
                <Typography variant="h6" gutterBottom>
                  Change Password
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      type={showPassword ? 'text' : 'password'}
                      variant="outlined"
                      {...register('currentPassword', {
                        required: activeTab === 1 ? 'Current password is required' : false,
                      })}
                      error={!!errors.currentPassword}
                      helperText={errors.currentPassword?.message}
                      disabled={isLoading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPassword}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="New Password"
                      type={showNewPassword ? 'text' : 'password'}
                      variant="outlined"
                      {...register('newPassword', {
                        required: activeTab === 1 ? 'New password is required' : false,
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      error={!!errors.newPassword}
                      helperText={errors.newPassword?.message}
                      disabled={isLoading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowNewPassword}
                              edge="end"
                            >
                              {showNewPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      type={showNewPassword ? 'text' : 'password'}
                      variant="outlined"
                      {...register('confirmPassword', {
                        validate: (value) =>
                          value === watch('newPassword') || 'Passwords do not match',
                      })}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword?.message}
                      disabled={isLoading}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isLoading}
                    >
                      {isLoading ? <CircularProgress size={24} /> : 'Update Password'}
                    </Button>
                  </Grid>
                </Grid>
              </form>

              <Box mt={6}>
                <Typography variant="h6" gutterBottom color="error">
                  Danger Zone
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderColor: 'error.main' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1">Delete Account</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Permanently delete your account and all associated data
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleDeleteAccount}
                      disabled={isLoading}
                    >
                      Delete Account
                    </Button>
                  </Box>
                </Paper>
              </Box>
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Your Statistics
              </Typography>
              
              {userStats ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <FitnessCenterIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">Workouts</Typography>
                      </Box>
                      <Typography variant="h3">{userStats.totalWorkouts}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total workouts completed
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <FitnessCenterIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">Favorite Exercise</Typography>
                      </Box>
                      <Typography variant="h5">{userStats.favoriteExercise}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Most frequently performed
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <FitnessCenterIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">Total Volume</Typography>
                      </Box>
                      <Typography variant="h3">
                        {userStats.totalVolume.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Kilograms lifted
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <Box display="flex" justifyContent="center" my={4}>
                  <CircularProgress />
                </Box>
              )}
              
              <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="textSecondary" align="center" py={4}>
                    Activity feed coming soon
                  </Typography>
                </Paper>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
