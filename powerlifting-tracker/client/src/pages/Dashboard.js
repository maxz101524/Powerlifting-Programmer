import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FitnessCenter as FitnessCenterIcon,
  ShowChart as ShowChartIcon,
  History as HistoryIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import axios from 'axios';

const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            color: `${color}.dark`,
            borderRadius: '50%',
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon, { fontSize: 'large' })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const RecentWorkoutItem = ({ workout }) => {
  const navigate = useNavigate();
  
  // Format date to be more readable
  const formattedDate = new Date(workout.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Get top 3 exercises by weight
  const topExercises = [...workout.workoutSets]
    .sort((a, b) => b.weightKg - a.weightKg)
    .slice(0, 3)
    .map(set => set.exerciseName);

  return (
    <Card 
      sx={{ 
        mb: 2, 
        '&:hover': { 
          boxShadow: 3, 
          cursor: 'pointer',
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease',
        } 
      }}
      onClick={() => navigate(`/workouts/${workout.id}`)}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {formattedDate}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {workout.workoutSets.length} exercises • {topExercises.join(', ')}
              {workout.workoutSets.length > 3 ? '...' : ''}
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" color="primary">
              {workout.workoutSets.reduce((sum, set) => sum + (set.weightKg * set.reps), 0).toFixed(0)} kg
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block" textAlign="right">
              Total Volume
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    bestLift: 'N/A',
    monthlyProgress: 0,
  });
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  // Error state is handled by the error variable from useAuth
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [workoutsRes, analyticsRes] = await Promise.all([
          axios.get('/api/workouts', {
            params: { limit: 5 }
          }),
          axios.get('/api/workouts/analytics/summary')
        ]);

        setRecentWorkouts(workoutsRes.data);
        
        // Process analytics data
        if (analyticsRes.data.exerciseData) {
          const exercises = Object.entries(analyticsRes.data.exerciseData);
          const bestLift = exercises.length > 0 
            ? exercises.sort((a, b) => b[1].bestSet.oneRM - a[1].bestSet.oneRM)[0]
            : null;

          setStats({
            totalWorkouts: analyticsRes.data.totalWorkouts || 0,
            bestLift: bestLift 
              ? `${bestLift[0]}: ${bestLift[1].bestSet.weightKg}kg x ${bestLift[1].bestSet.reps}`
              : 'N/A',
            monthlyProgress: 0, // This would be calculated based on your analytics
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        // Error is logged to console
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }


  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Here's what's been happening with your training
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/log-workout')}
        >
          New Workout
        </Button>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Workouts"
            value={stats.totalWorkouts}
            icon={<FitnessCenterIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Best Lift"
            value={stats.bestLift}
            icon={<ShowChartIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Monthly Progress"
            value={`${stats.monthlyProgress}%`}
            icon={<HistoryIcon />}
            color="success"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2">
                  Recent Workouts
                </Typography>
                <Button 
                  size="small" 
                  color="primary"
                  onClick={() => navigate('/workouts')}
                >
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {recentWorkouts.length > 0 ? (
                recentWorkouts.map((workout) => (
                  <RecentWorkoutItem key={workout.id} workout={workout} />
                ))
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="textSecondary" gutterBottom>
                    No workouts yet
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/log-workout')}
                  >
                    Log Your First Workout
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FitnessCenterIcon />}
                sx={{ mb: 1, justifyContent: 'flex-start' }}
                onClick={() => navigate('/log-workout')}
              >
                Log New Workout
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ShowChartIcon />}
                sx={{ mb: 1, justifyContent: 'flex-start' }}
                onClick={() => navigate('/progress')}
              >
                View Progress
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<HistoryIcon />}
                sx={{ justifyContent: 'flex-start' }}
                onClick={() => navigate('/workouts')}
              >
                Workout History
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                Tips
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="textSecondary" paragraph>
                • Track your workouts consistently for better progress insights.
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                • Aim to gradually increase weight or reps over time.
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Don't forget to log your RPE for better training analysis.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
