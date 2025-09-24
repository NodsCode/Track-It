// src/features/habits/HabitList.tsx
import React from 'react';
import { useHabits } from '../../contexts/HabitContext';
import { Habit } from '../../types';
import { useGoals } from '../../contexts/GoalContext'; 

// ... (getFrequencyString helper)
const getFrequencyString = (freq: Habit['frequency']): string => {
    switch(freq.type) {
        case 'daily': return 'Daily';
        case 'weekly': return `Weekly on ${freq.days.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}`;
        case 'monthly': return `Monthly on day ${freq.dayOfMonth}`;
        default: return 'Custom';
    }
}


interface HabitListProps {
  onEditHabit: (habit: Habit) => void;
}

const HabitList: React.FC<HabitListProps> = ({ onEditHabit }) => {
  const { habits, archiveHabit, permanentlyDeleteHabit } = useHabits(); // Use new functions
  const { getGoalById } = useGoals();

  if (habits.length === 0) {
    return <p>No active habits yet. Add one to get started!</p>;
  }

  return (
    <div>
      {habits.map(habit => {
        const goal = habit.goalId ? getGoalById(habit.goalId) : null;
        return (
          <div key={habit.id} className="card">
            <h3>{habit.name}</h3>
            {/* ... (other habit details) ... */}
            {habit.description && <p>{habit.description}</p>}
            <p><strong>Frequency:</strong> {getFrequencyString(habit.frequency)}</p>
            <p><strong>Start Date:</strong> {new Date(habit.startDate).toLocaleDateString()}</p>
            {habit.duration && <p><strong>Duration:</strong> {habit.duration.value} {habit.duration.unit}</p>}
            {habit.endDate && <p><strong>Ends On:</strong> {new Date(habit.endDate).toLocaleDateString()}</p>}
            {habit.isQuantitative && (
                <p><strong>Quantitative:</strong> Yes 
                {habit.targetValue && ` (Target: ${habit.targetValue} ${habit.quantitativeUnit || ''})`}
                {!habit.targetValue && habit.quantitativeUnit && ` (Unit: ${habit.quantitativeUnit})`}
                </p>
            )}
            {goal && <p><strong>Goal:</strong> {goal.name}</p>}

            <div style={{ marginTop: '10px' }}>
              <button onClick={() => onEditHabit(habit)}>Edit</button>
              <button 
                className="secondary" 
                onClick={() => {
                  if (window.confirm(`Are you sure you want to archive "${habit.name}"? This will move it to the archive and it can be reviewed later.`)) {
                    archiveHabit(habit.id);
                  }
                }}
                style={{ marginLeft: '5px' }}
              >
                Archive
              </button>
              <button 
                className="danger" // Add a new CSS class for danger buttons
                onClick={() => {
                  if (window.confirm(`DANGER! Are you sure you want to PERMANENTLY DELETE "${habit.name}"? This action cannot be undone and will remove all its data.`)) {
                    permanentlyDeleteHabit(habit.id);
                  }
                }}
                style={{ marginLeft: '5px' }}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HabitList;