// src/pages/ArchivePage.tsx
import React from 'react';
import { useHabits } from '../contexts/HabitContext'; // Import useHabits
import { useGoals } from '../contexts/GoalContext';   // Import useGoals
import { Habit, Goal, HabitInstance } from '../types';
import { parseISO, format } from 'date-fns';
// import JournalModal from '../features/archive/JournalModal'; 

const ArchivePage: React.FC = () => {
  // Use contexts to get all items and deletion functions
  const { allHabits, permanentlyDeleteHabit, unarchiveHabit, habitInstances } = useHabits(); 
  const { allGoals, permanentlyDeleteGoal, unarchiveGoal } = useGoals();


  const archivedHabits = allHabits.filter(h => h.archived);
  const archivedGoals = allGoals.filter(g => g.archived);

  const handlePermanentDeleteHabit = (habitId: string, habitName: string) => {
    if (window.confirm(`Are you sure you want to PERMANENTLY DELETE the archived habit "${habitName}"? This action cannot be undone.`)) {
      permanentlyDeleteHabit(habitId);
    }
  };

  const handlePermanentDeleteGoal = (goalId: string, goalName: string) => {
    if (window.confirm(`Are you sure you want to PERMANENTLY DELETE the archived goal "${goalName}"? This action cannot be undone.`)) {
      permanentlyDeleteGoal(goalId);
    }
  };
  
  const handleUnarchiveHabit = (habitId: string) => {
    unarchiveHabit(habitId);
    // Optionally, add a user notification
  };

  const handleUnarchiveGoal = (goalId: string) => {
    unarchiveGoal(goalId);
    // Optionally, add a user notification
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'PPpp'); // e.g., Sep 20, 2023, 4:30 PM
    } catch (error) {
      return 'Invalid Date';
    }
  };


  return (
    <div>
      <h2>Archive</h2>
      
      <section>
        <h3>Archived Habits</h3>
        {archivedHabits.length === 0 && <p>No habits archived yet.</p>}
        {archivedHabits.map(habit => (
          <div key={habit.id} className="card">
            <h4>{habit.name}</h4>
            {habit.description && <p><strong>Description:</strong> {habit.description}</p>}
            <p><strong>Created:</strong> {formatDate(habit.createdAt)}</p>
            <p><strong>Archived On:</strong> {habit.archivedAt ? formatDate(habit.archivedAt) : 'Previously (date not recorded)'}</p>
            <h5>Related Instances:</h5>
            <ul>
             {habitInstances // Use habitInstances from context
                 .filter(inst => inst.habitId === habit.id)
                 .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()) // Show recent first
                 .map(inst => (
                     <li key={inst.id}>
                         Scheduled: {new Date(inst.scheduledDate).toLocaleDateString()} - 
                         {inst.completed ? `Completed (${inst.completionDate ? new Date(inst.completionDate).toLocaleDateString() : 'Yes'})` : 'Not completed'}
                         {inst.quantitativeValue !== undefined && ` - Value: ${inst.quantitativeValue}`}
                         {inst.notes && <p style={{margin:'2px 0', fontSize: '0.9em'}}><i>Notes: {inst.notes}</i></p>}
                     </li>
             ))}
            </ul>
            <div style={{ marginTop: '10px' }}>
              <button 
                className="secondary" 
                onClick={() => handleUnarchiveHabit(habit.id)}
              >
                Unarchive
              </button>
              <button 
                className="danger" 
                onClick={() => handlePermanentDeleteHabit(habit.id, habit.name)}
                style={{ marginLeft: '5px' }}
              >
                Delete
              </button>
            </div>
            {/* Option to add/edit final reflection/journal */}
          </div>
        ))}
      </section>

      <section style={{marginTop: '30px'}}>
        <h3>Archived Goals</h3>
        {archivedGoals.length === 0 && <p>No goals archived yet.</p>}
        {archivedGoals.map(goal => (
          <div key={goal.id} className="card">
            <h4>{goal.name} (Archived)</h4>
            {goal.description && <p><strong>Description:</strong> {goal.description}</p>}
            <p><strong>Created:</strong> {formatDate(goal.createdAt)}</p>
            <p><strong>Archived On:</strong> {goal.archivedAt ? formatDate(goal.archivedAt) : 'Previously (date not recorded)'}</p>
             <div style={{ marginTop: '10px' }}>
              <button 
                className="secondary" 
                onClick={() => handleUnarchiveGoal(goal.id)}
              >
                Unarchive
              </button>
              <button 
                className="danger" 
                onClick={() => handlePermanentDeleteGoal(goal.id, goal.name)}
                style={{ marginLeft: '5px' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default ArchivePage;