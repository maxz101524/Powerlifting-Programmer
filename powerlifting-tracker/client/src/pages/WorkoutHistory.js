import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TablePagination,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  Search as SearchIcon, 
  FilterList as FilterListIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  FitnessCenter as FitnessCenterIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import axios from 'axios';

const WorkoutHistory = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  // State for delete dialog (not currently used)
  // const [deleteDialog, setDeleteDialog] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/workouts');
        setWorkouts(response.data);
      } catch (error) {
        console.error('Error fetching workouts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
    setPage(0);
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (window.confirm('Are you sure you want to delete this workout?')) {
      try {
        await axios.delete(`/api/workouts/${workoutId}`);
        setWorkouts(workouts.filter(workout => workout.id !== workoutId));
      } catch (error) {
        console.error('Error deleting workout:', error);
      }
    }
  };

  const filteredWorkouts = workouts.filter(workout => {
    // Filter by search term
    const matchesSearch = 
      workout.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workout.workoutSets.some(set => 
        set.exerciseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        set.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Filter by filter type
    let matchesFilter = true;
    if (filter === 'this_week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      matchesFilter = new Date(workout.date) >= oneWeekAgo;
    } else if (filter === 'this_month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      matchesFilter = new Date(workout.date) >= oneMonthAgo;
    }

    return matchesSearch && matchesFilter;
  });

  const paginatedWorkouts = filteredWorkouts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getExerciseSummary = (sets) => {
    const exerciseMap = new Map();
    
    sets.forEach(set => {
      if (!exerciseMap.has(set.exerciseName)) {
        exerciseMap.set(set.exerciseName, {
          name: set.exerciseName,
          sets: 0,
          maxWeight: 0,
          totalReps: 0,
          totalVolume: 0,
        });
      }
      
      const exercise = exerciseMap.get(set.exerciseName);
      exercise.sets += 1;
      exercise.maxWeight = Math.max(exercise.maxWeight, set.weightKg);
      exercise.totalReps += set.reps;
      exercise.totalVolume += set.weightKg * set.reps;
    });
    
    return Array.from(exerciseMap.values());
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Workout History
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/log-workout')}
        >
          New Workout
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" flexWrap="wrap" gap={2}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search workouts..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300, flexGrow: 1 }}
            />
            <Box display="flex" gap={1}>
              <Button
                variant={showFilters ? 'contained' : 'outlined'}
                onClick={() => setShowFilters(!showFilters)}
                startIcon={<FilterListIcon />}
              >
                Filters
              </Button>
              {showFilters && (
                <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
                  <InputLabel id="time-filter-label">Time Period</InputLabel>
                  <Select
                    labelId="time-filter-label"
                    value={filter}
                    onChange={handleFilterChange}
                    label="Time Period"
                  >
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="this_week">This Week</MenuItem>
                    <MenuItem value="this_month">This Month</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {filteredWorkouts.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <FitnessCenterIcon color="action" sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No workouts found
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by logging your first workout.'}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate('/log-workout')}
              >
                Log Workout
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Exercises</TableCell>
                    <TableCell>Volume (kg)</TableCell>
                    <TableCell>Sets</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedWorkouts.map((workout) => {
                    const exerciseSummary = getExerciseSummary(workout.workoutSets);
                    const totalVolume = exerciseSummary.reduce((sum, ex) => sum + ex.totalVolume, 0);
                    const totalSets = exerciseSummary.reduce((sum, ex) => sum + ex.sets, 0);
                    
                    return (
                      <TableRow 
                        key={workout.id}
                        hover
                        sx={{ '&:hover': { cursor: 'pointer' } }}
                        onClick={() => navigate(`/workouts/${workout.id}`)}
                      >
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {format(parseISO(workout.date), 'MMM d, yyyy')}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {format(parseISO(workout.date), 'EEEE')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" flexWrap="wrap" gap={1} maxWidth={400}>
                            {exerciseSummary.slice(0, 3).map((exercise, idx) => (
                              <Tooltip 
                                key={idx} 
                                title={`${exercise.sets} set${exercise.sets > 1 ? 's' : ''}, ${exercise.totalReps} reps, ${exercise.maxWeight}kg max`}
                                arrow
                              >
                                <Chip 
                                  label={`${exercise.name} (${exercise.sets}×${exercise.maxWeight}kg)`}
                                  size="small"
                                  variant="outlined"
                                />
                              </Tooltip>
                            ))}
                            {exerciseSummary.length > 3 && (
                              <Chip 
                                label={`+${exerciseSummary.length - 3} more`} 
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                          {workout.notes && (
                            <Typography 
                              variant="body2" 
                              color="textSecondary" 
                              sx={{
                                mt: 1,
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 400,
                              }}
                            >
                              {workout.notes}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {totalVolume.toLocaleString()} kg
                          </Typography>
                        </TableCell>
                        <TableCell>{totalSets}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="flex-end" gap={1}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/workouts/${workout.id}/edit`);
                              }}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWorkout(workout.id);
                              }}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredWorkouts.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Card>
        </>
      )}
    </Box>
  );
};

export default WorkoutHistory;
