const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all workouts for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const workouts = await prisma.workout.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
      include: {
        workoutSets: true,
      },
    });
    res.json(workouts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new workout
router.post('/', protect, async (req, res) => {
  try {
    const { date, notes, sets } = req.body;

    const workout = await prisma.workout.create({
      data: {
        userId: req.user.id,
        date: new Date(date),
        notes,
        workoutSets: {
          create: sets.map((set) => ({
            exerciseName: set.exerciseName,
            weightKg: parseFloat(set.weightKg),
            reps: parseInt(set.reps),
            rpe: set.rpe ? parseFloat(set.rpe) : null,
            notes: set.notes || null,
          })),
        },
      },
      include: {
        workoutSets: true,
      },
    });

    res.status(201).json(workout);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Workout analytics must be defined before routes using dynamic :id
router.get('/analytics/summary', protect, async (req, res) => {
  try {
    // Get all workouts with sets for the user
    const workouts = await prisma.workout.findMany({
      where: { userId: req.user.id },
      include: {
        workoutSets: true,
      },
      orderBy: { date: 'asc' },
    });

    // Calculate 1RM using Epley formula
    const calculate1RM = (weight, reps) => {
      return weight * (1 + 0.0333 * reps);
    };

    // Group sets by exercise and calculate best set
    const exerciseData = {};
    workouts.forEach((workout) => {
      workout.workoutSets.forEach((set) => {
        const exerciseName = set.exerciseName;
        const oneRM = calculate1RM(set.weightKg, set.reps);

        if (!exerciseData[exerciseName]) {
          exerciseData[exerciseName] = {
            bestSet: { weight: 0, reps: 0, date: null, oneRM: 0 },
            volumeOverTime: [],
            oneRMOverTime: [],
          };
        }

        // Track best set by 1RM
        if (oneRM > exerciseData[exerciseName].bestSet.oneRM) {
          exerciseData[exerciseName].bestSet = {
            weight: set.weightKg,
            reps: set.reps,
            date: workout.date,
            oneRM,
          };
        }

        // Track volume and 1RM over time
        exerciseData[exerciseName].volumeOverTime.push({
          date: workout.date,
          volume: set.weightKg * set.reps,
        });

        exerciseData[exerciseName].oneRMOverTime.push({
          date: workout.date,
          oneRM,
        });
      });
    });

    // Get recent workouts
    const recentWorkouts = workouts
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    res.json({
      exerciseData,
      recentWorkouts,
      totalWorkouts: workouts.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single workout
router.get('/:id', protect, async (req, res) => {
  try {
    const workout = await prisma.workout.findUnique({
      where: { id: req.params.id },
      include: {
        workoutSets: true,
      },
    });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    // Make sure user owns the workout
    if (workout.userId !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(workout);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a workout
router.put('/:id', protect, async (req, res) => {
  try {
    const { date, notes, sets } = req.body;

    // Check if workout exists and belongs to user
    const existingWorkout = await prisma.workout.findUnique({
      where: { id: req.params.id },
    });

    if (!existingWorkout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    if (existingWorkout.userId !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Delete existing sets
    await prisma.workoutSet.deleteMany({
      where: { workoutId: req.params.id },
    });

    // Update workout and create new sets
    const workout = await prisma.workout.update({
      where: { id: req.params.id },
      data: {
        date: new Date(date),
        notes,
        workoutSets: {
          create: sets.map((set) => ({
            exerciseName: set.exerciseName,
            weightKg: parseFloat(set.weightKg),
            reps: parseInt(set.reps),
            rpe: set.rpe ? parseFloat(set.rpe) : null,
            notes: set.notes || null,
          })),
        },
      },
      include: {
        workoutSets: true,
      },
    });

    res.json(workout);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a workout
router.delete('/:id', protect, async (req, res) => {
  try {
    // Check if workout exists and belongs to user
    const workout = await prisma.workout.findUnique({
      where: { id: req.params.id },
    });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    if (workout.userId !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Delete the workout (cascades to workoutSets due to Prisma's referential actions)
    await prisma.workout.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Workout removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
