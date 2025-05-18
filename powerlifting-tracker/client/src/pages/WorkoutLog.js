import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormHelperText,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
// format function is used in the component
import axios from 'axios';

const ExerciseRow = ({ exercise, index, onUpdate, onRemove }) => {
  const [isEditing, setIsEditing] = useState(!exercise.id);
  const [formData, setFormData] = useState({
    exerciseName: exercise.exerciseName || '',
    weightKg: exercise.weightKg || '',
    reps: exercise.reps || '',
    rpe: exercise.rpe || '',
    // notes: exercise.notes || '',
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: formData,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = (data) => {
    onUpdate(index, {
      ...formData,
      weightKg: parseFloat(formData.weightKg),
      reps: parseInt(formData.reps),
      rpe: formData.rpe ? parseFloat(formData.rpe) : null,
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>
          <TextField
            size="small"
            fullWidth
            {...register('exerciseName', { required: 'Exercise name is required' })}
            value={formData.exerciseName}
            onChange={handleChange}
            error={!!errors.exerciseName}
            helperText={errors.exerciseName?.message}
          />
        </TableCell>
        <TableCell>
          <TextField
            size="small"
            type="number"
            inputProps={{ step: '0.5', min: '0' }}
            {...register('weightKg', { 
              required: 'Weight is required',
              min: { value: 0, message: 'Weight must be positive' }
            })}
            value={formData.weightKg}
            onChange={handleChange}
            error={!!errors.weightKg}
          />
        </TableCell>
        <TableCell>
          <TextField
            size="small"
            type="number"
            inputProps={{ min: '1' }}
            {...register('reps', { 
              required: 'Reps are required',
              min: { value: 1, message: 'At least 1 rep required' }
            })}
            value={formData.reps}
            onChange={handleChange}
            error={!!errors.reps}
          />
        </TableCell>
        <TableCell>
          <TextField
            size="small"
            type="number"
            inputProps={{ min: '0', max: '10', step: '0.5' }}
            {...register('rpe', { 
              min: { value: 0, message: 'RPE must be between 0-10' },
              max: { value: 10, message: 'RPE must be between 0-10' }
            })}
            value={formData.rpe}
            onChange={handleChange}
            error={!!errors.rpe}
          />
        </TableCell>
        <TableCell>
          <TextField
            size="small"
            {...register('notes')}
            value={formData.notes}
            onChange={handleChange}
          />
        </TableCell>
        <TableCell>
          <Box display="flex" gap={1}>
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={handleSubmit(handleSave)}
            >
              Save
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => onRemove(index)}
            >
              Cancel
            </Button>
          </Box>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>{formData.exerciseName}</TableCell>
      <TableCell>{formData.weightKg} kg</TableCell>
      <TableCell>{formData.reps}</TableCell>
      <TableCell>{formData.rpe || '-'}</TableCell>
      <TableCell>{formData.notes || '-'}</TableCell>
      <TableCell>
        <IconButton size="small" onClick={() => setIsEditing(true)}>
          <SaveIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => onRemove(index)}>
          <DeleteIcon fontSize="small" color="error" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

const WorkoutLog = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([
    { id: Date.now(), exerciseName: '', weightKg: '', reps: '', rpe: '', notes: '' },
  ]);
  const [workoutDate, setWorkoutDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      workoutDate: new Date(),
      notes: '',
    },
  });

  const addExercise = () => {
    setExercises([
      ...exercises,
      { id: Date.now(), exerciseName: '', weightKg: '', reps: '', rpe: '', notes: '' },
    ]);
  };

  const updateExercise = (index, updatedExercise) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], ...updatedExercise };
    setExercises(newExercises);
  };

  const removeExercise = (index) => {
    if (exercises.length === 1) {
      setExercises([{ id: Date.now(), exerciseName: '', weightKg: '', reps: '', rpe: '', notes: '' }]);
    } else {
      const newExercises = exercises.filter((_, i) => i !== index);
      setExercises(newExercises);
    }
  };

  const onSubmit = async (data) => {
    // Filter out empty exercises
    const validExercises = exercises.filter(
      (ex) => ex.exerciseName && ex.weightKg && ex.reps
    );

    if (validExercises.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please add at least one exercise',
        severity: 'error',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const workoutData = {
        date: format(workoutDate, 'yyyy-MM-dd'),
        notes: data.notes,
        sets: validExercises.map((ex) => ({
          exerciseName: ex.exerciseName,
          weightKg: parseFloat(ex.weightKg),
          reps: parseInt(ex.reps),
          rpe: ex.rpe ? parseFloat(ex.rpe) : null,
          notes: ex.notes || null,
        })),
      };

      await axios.post('/api/workouts', workoutData);
      
      setSnackbar({
        open: true,
        message: 'Workout saved successfully!',
        severity: 'success',
      });
      
      // Reset form
      setExercises([{ id: Date.now(), exerciseName: '', weightKg: '', reps: '', rpe: '', notes: '' }]);
      setNotes('');
      setWorkoutDate(new Date());
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving workout:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save workout. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Log Workout
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardHeader title="Workout Details" />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Controller
                  name="workoutDate"
                  control={control}
                  rules={{ required: 'Workout date is required' }}
                  render={({ field }) => (
                    <DatePicker
                      label="Workout Date"
                      value={workoutDate}
                      onChange={(date) => {
                        setWorkoutDate(date);
                        field.onChange(date);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!errors.workoutDate}
                          helperText={errors.workoutDate?.message}
                        />
                      )}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Workout Notes"
                    multiline
                    rows={3}
                    fullWidth
                    placeholder="How did it feel? Any additional notes?"
                  />
                )}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardHeader 
          title="Exercises" 
          action={
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={addExercise}
            >
              Add Exercise
            </Button>
          }
        />
        <Divider />
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Exercise</TableCell>
                  <TableCell>Weight (kg)</TableCell>
                  <TableCell>Reps</TableCell>
                  <TableCell>RPE</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exercises.map((exercise, index) => (
                  <ExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    index={index}
                    onUpdate={updateExercise}
                    onRemove={removeExercise}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
        <Button
          variant="outlined"
          onClick={() => navigate('/dashboard')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || exercises.length === 0}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {isSubmitting ? 'Saving...' : 'Save Workout'}
        </Button>
      </Box>

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

export default WorkoutLog;
