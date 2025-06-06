import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Button,
  IconButton
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon } from '@mui/icons-material';
import axios from 'axios';

const WorkoutDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const res = await axios.get(`/api/workouts/${id}`);
        setWorkout(res.data);
      } catch (err) {
        console.error('Error fetching workout:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkout();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!workout) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography variant="h6">Workout not found</Typography>
      </Box>
    );
  }

  const formattedDate = new Date(workout.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Workout Details
        </Typography>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/workouts/${id}/edit`)}
        >
          Edit
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">{formattedDate}</Typography>
          {workout.notes && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {workout.notes}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Exercise</TableCell>
                <TableCell>Weight (kg)</TableCell>
                <TableCell>Reps</TableCell>
                <TableCell>RPE</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workout.workoutSets.map((set) => (
                <TableRow key={set.id}>
                  <TableCell>{set.exerciseName}</TableCell>
                  <TableCell>{set.weightKg}</TableCell>
                  <TableCell>{set.reps}</TableCell>
                  <TableCell>{set.rpe ?? '-'}</TableCell>
                  <TableCell>{set.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WorkoutDetails;
