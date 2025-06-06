-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Workout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Workout" ("createdAt", "date", "id", "notes", "updatedAt", "userId") SELECT "createdAt", "date", "id", "notes", "updatedAt", "userId" FROM "Workout";
DROP TABLE "Workout";
ALTER TABLE "new_Workout" RENAME TO "Workout";
CREATE TABLE "new_WorkoutSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutId" TEXT NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "weightKg" REAL NOT NULL,
    "reps" INTEGER NOT NULL,
    "rpe" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkoutSet_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WorkoutSet" ("createdAt", "exerciseName", "id", "notes", "reps", "rpe", "weightKg", "workoutId") SELECT "createdAt", "exerciseName", "id", "notes", "reps", "rpe", "weightKg", "workoutId" FROM "WorkoutSet";
DROP TABLE "WorkoutSet";
ALTER TABLE "new_WorkoutSet" RENAME TO "WorkoutSet";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
