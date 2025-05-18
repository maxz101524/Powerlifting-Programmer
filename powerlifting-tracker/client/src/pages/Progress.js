import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Chip,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { format, subMonths, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import axios from 'axios';

const Progress = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [timeRange, setTimeRange] = useState('3m');
  const [chartType, setChartType] = useState('volume');
  const [availableExercises, setAvailableExercises] = useState([]);
  // Summary state is kept for future use
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/workouts');
        setWorkouts(response.data);
        
        // Extract unique exercises
        const exercises = new Set();
        response.data.forEach(workout => {
          workout.workoutSets.forEach(set => {
            exercises.add(set.exerciseName);
          });
        });
        
        const exercisesArray = Array.from(exercises).sort();
        setAvailableExercises(exercisesArray);
        
        if (exercisesArray.length > 0) {
          setSelectedExercise(exercisesArray[0]);
        }
        
        // Calculate summary
        calculateSummary(response.data);
        
      } catch (error) {
        console.error('Error fetching workouts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  const calculateSummary = (workoutData) => {
    if (!workoutData || workoutData.length === 0) return;
    
    const now = new Date();
    const oneWeekAgo = subMonths(now, 1);
    
    const recentWorkouts = workoutData.filter(workout => 
      new Date(workout.date) >= oneWeekAgo
    );
    
    const exerciseMap = new Map();
    
    workoutData.forEach(workout => {
      workout.workoutSets.forEach(set => {
        if (!exerciseMap.has(set.exerciseName)) {
          exerciseMap.set(set.exerciseName, {
            name: set.exerciseName,
            totalVolume: 0,
            maxWeight: 0,
            totalReps: 0,
            totalSets: 0,
            dates: [],
          });
        }
        
        const exercise = exerciseMap.get(set.exerciseName);
        const volume = set.weightKg * set.reps;
        
        exercise.totalVolume += volume;
        exercise.maxWeight = Math.max(exercise.maxWeight, set.weightKg);
        exercise.totalReps += set.reps;
        exercise.totalSets += 1;
        exercise.dates.push({
          date: workout.date,
          weight: set.weightKg,
          reps: set.reps,
          volume,
        });
      });
    });
    
    // Sort exercises by total volume (descending)
    const sortedExercises = Array.from(exerciseMap.values()).sort(
      (a, b) => b.totalVolume - a.totalVolume
    );
    
    // Calculate weekly volume
    const weeklyVolume = recentWorkouts.reduce((sum, workout) => {
      return sum + workout.workoutSets.reduce((workoutSum, set) => {
        return workoutSum + (set.weightKg * set.reps);
      }, 0);
    }, 0);
    
    // Calculate PRs
    const prs = [];
    exerciseMap.forEach(exercise => {
      if (exercise.dates.length > 0) {
        const maxByWeight = exercise.dates.reduce((max, current) => 
          (current.weight > max.weight ? current : max), exercise.dates[0]);
          
        prs.push({
          exercise: exercise.name,
          weight: maxByWeight.weight,
          reps: maxByWeight.reps,
          date: maxByWeight.date,
        });
      }
    });
    
    setSummary({
      totalWorkouts: workoutData.length,
      weeklyVolume,
      favoriteExercise: sortedExercises[0]?.name || 'N/A',
      prs: prs.sort((a, b) => b.weight - a.weight).slice(0, 3),
      topExercises: sortedExercises.slice(0, 3).map(ex => ({
        name: ex.name,
        volume: ex.totalVolume,
        sets: ex.totalSets,
      })),
    });
  };

  const getFilteredData = () => {
    if (!selectedExercise) return [];
    
    let filteredWorkouts = [...workouts];
    
    // Filter by time range
    if (timeRange !== 'all') {
      const months = parseInt(timeRange);
      const cutoffDate = subMonths(new Date(), months);
      filteredWorkouts = filteredWorkouts.filter(workout => 
        new Date(workout.date) >= cutoffDate
      );
    }
    
    // Group by date and exercise
    const dateMap = new Map();
    
    filteredWorkouts.forEach(workout => {
      const workoutDate = format(parseISO(workout.date), 'yyyy-MM-dd');
      
      workout.workoutSets
        .filter(set => set.exerciseName === selectedExercise)
        .forEach(set => {
          if (!dateMap.has(workoutDate)) {
            dateMap.set(workoutDate, {
              date: workoutDate,
              volume: 0,
              maxWeight: 0,
              totalReps: 0,
              sets: 0,
              avgWeight: 0,
            });
          }
          
          const dayData = dateMap.get(workoutDate);
          const volume = set.weightKg * set.reps;
          
          dayData.volume += volume;
          dayData.maxWeight = Math.max(dayData.maxWeight, set.weightKg);
          dayData.totalReps += set.reps;
          dayData.sets += 1;
          dayData.avgWeight = dayData.volume / dayData.totalReps;
        });
    });
    
    // Convert map to array and sort by date
    return Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const chartData = getFilteredData();
  
  const formatXAxis = (tickItem) => {
    return format(parseISO(tickItem), 'MMM d');
  };
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, bgcolor: 'background.paper', boxShadow: 3 }}>
          <Typography variant="subtitle2">{format(parseISO(label), 'MMMM d, yyyy')}</Typography>
          {chartType === 'volume' && (
            <Typography>{`Volume: ${payload[0].value.toLocaleString()} kg`}</Typography>
          )}
          {chartType === 'weight' && (
            <Typography>{`Max Weight: ${payload[0].value} kg`}</Typography>
          )}
          {chartType === 'reps' && (
            <Typography>{`Total Reps: ${payload[0].value}`}</Typography>
          )}
          <Typography variant="caption">Sets: {payload[0].payload.sets}</Typography>
        </Paper>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Progress Tracking
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Track your strength and performance over time
        </Typography>
      </Box>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Workouts
                </Typography>
                <Typography variant="h4">{summary.totalWorkouts}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Weekly Volume
                </Typography>
                <Typography variant="h4">
                  {summary.weeklyVolume.toLocaleString()} kg
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Favorite Exercise
                </Typography>
                <Typography variant="h5">{summary.favoriteExercise}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Personal Records
                </Typography>
                <Box>
                  {summary.prs.map((pr, index) => (
                    <Chip
                      key={index}
                      label={`${pr.exercise}: ${pr.weight}kg x ${pr.reps}`}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2">
                  Exercise Progress
                </Typography>
                <Box display="flex" gap={2}>
                  <FormControl size="small" variant="outlined">
                    <InputLabel>Exercise</InputLabel>
                    <Select
                      value={selectedExercise}
                      onChange={(e) => setSelectedExercise(e.target.value)}
                      label="Exercise"
                      sx={{ minWidth: 150 }}
                    >
                      {availableExercises.map((exercise) => (
                        <MenuItem key={exercise} value={exercise}>
                          {exercise}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" variant="outlined">
                    <InputLabel>Time Range</InputLabel>
                    <Select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      label="Time Range"
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="1">1 Month</MenuItem>
                      <MenuItem value="3">3 Months</MenuItem>
                      <MenuItem value="6">6 Months</MenuItem>
                      <MenuItem value="12">1 Year</MenuItem>
                      <MenuItem value="all">All Time</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={(e, newType) => newType && setChartType(newType)}
                aria-label="chart type"
                size="small"
                sx={{ mb: 2 }}
              >
                <ToggleButton value="volume" aria-label="volume">
                  Volume (kg)
                </ToggleButton>
                <ToggleButton value="weight" aria-label="weight">
                  Max Weight (kg)
                </ToggleButton>
                <ToggleButton value="reps" aria-label="reps">
                  Total Reps
                </ToggleButton>
              </ToggleButtonGroup>
              
              <Box height={400}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatXAxis}
                        minTickGap={20}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey={chartType === 'volume' ? 'volume' : chartType === 'weight' ? 'maxWeight' : 'totalReps'}
                        name={chartType === 'volume' ? 'Volume (kg)' : chartType === 'weight' ? 'Max Weight (kg)' : 'Total Reps'}
                        stroke="#1976d2"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center" 
                    height="100%"
                    textAlign="center"
                  >
                    <div>
                      <Typography variant="h6" gutterBottom>
                        No data available
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {selectedExercise 
                          ? `No ${selectedExercise} workouts found in the selected time range.`
                          : 'Select an exercise to view progress.'}
                      </Typography>
                    </div>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Exercises by Volume
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {summary && summary.topExercises.length > 0 ? (
                <Box>
                  {summary.topExercises.map((exercise, index) => (
                    <Box key={index} mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="subtitle2">
                          {exercise.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {exercise.sets} sets
                        </Typography>
                      </Box>
                      <Box width="100%" bgcolor="action.hover" borderRadius={1}>
                        <Box
                          bgcolor="primary.main"
                          height={8}
                          width={`${Math.min(100, (exercise.volume / summary.topExercises[0].volume) * 100)}%`}
                          borderRadius={1}
                        />
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {exercise.volume.toLocaleString()} kg
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary" align="center" py={2}>
                  No exercise data available
                </Typography>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Progress Tips
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Track Consistently
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Log every workout to see accurate progress over time. Even light sessions contribute to your overall progress.
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Progressive Overload
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Aim to gradually increase weight, reps, or volume in your exercises to continue making progress.
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Recovery Matters
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Pay attention to how your performance changes with different recovery periods and adjust your training accordingly.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Progress;
