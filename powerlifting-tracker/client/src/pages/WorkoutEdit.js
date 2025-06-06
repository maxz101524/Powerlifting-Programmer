import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WorkoutLog from './WorkoutLog';
import axios from 'axios';

const WorkoutEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const res = await axios.get(`/api/workouts/${id}`);
        const workout = res.data;
        setInitialData({
          date: new Date(workout.date),
          notes: workout.notes || '',
          sets: workout.workoutSets.map((s) => ({
            id: s.id,
            exerciseName: s.exerciseName,
            weightKg: s.weightKg,
            reps: s.reps,
            rpe: s.rpe || '',
            notes: s.notes || '',
          }))
        });
      } catch (err) {
        console.error('Error loading workout:', err);
        navigate('/workouts');
      }
    };
    fetchWorkout();
  }, [id, navigate]);

  if (!initialData) return null;

  return <WorkoutLog editId={id} initialData={initialData} />;
};

export default WorkoutEdit;
