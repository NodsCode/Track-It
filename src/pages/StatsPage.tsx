// src/pages/StatsPage.tsx
import React from 'react';
import { useHabits } from '../contexts/HabitContext';
import { useGoals } from '../contexts/GoalContext';
import HabitCircle from '../components/HabitCircle'; 

const StatsPage: React.FC = () => {
  const { habits, habitInstances } = useHabits();
  const { goals } = useGoals();

  const totalHabits = habits.length;
  const completedInstancesLifetime = habitInstances.filter(inst => inst.completed).length;
  // totalInstancesLifetime is no longer needed here for this specific HabitCircle

  return (
    <div>
      <h2>Statistics</h2>

      <div className="card">
        <h3>Habit Stats</h3>
        <p>Total Active Habits: {totalHabits}</p>
        <p>Lifetime Completed Habit Instances: {completedInstancesLifetime}</p>
        {/* This is a raw count. The circle below will show a percentage based on due instances. */}
      </div>

      <div className="card">
        <h3>Goal Stats</h3>
        <p>Total Active Goals: {goals.length}</p>
      </div>

      <div className="card">
        <h3>Visualizations</h3>
        <p style={{textAlign: 'center'}}><i>Overall Completion Rate</i></p>
        <HabitCircle /> {/* Props are no longer needed as logic is internal */}
      </div>
    </div>
  );
};

export default StatsPage;