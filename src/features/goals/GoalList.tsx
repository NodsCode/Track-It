// src/features/goals/GoalList.tsx
import React from 'react';
import { useGoals } from '../../contexts/GoalContext';
import { Goal } from '../../types';
// import ProgressBar from '../../components/common/ProgressBar'; // Assuming this exists

const ProgressBar: React.FC<{ percentage: number }> = ({ percentage }) => {
    const validPercentage = Math.max(0, Math.min(100, percentage));
    return (
        <div className="progress-bar-container">
            <div className="progress-bar-filler" style={{ width: `${validPercentage}%` }}>
                <span>{validPercentage.toFixed(0)}%</span>
            </div>
        </div>
    );
};

interface GoalListProps {
  onEditGoal: (goal: Goal) => void;
}

const GoalList: React.FC<GoalListProps> = ({ onEditGoal }) => {
  const { goals, archiveGoal, permanentlyDeleteGoal, getGoalProgress, getHabitsForGoal } = useGoals(); // Use new functions

  if (goals.length === 0) {
    return <p>No active goals yet. Add one to get started!</p>;
  }

  return (
    <div>
      {goals.map(goal => {
        const progress = getGoalProgress(goal.id);
        const habitsInGoal = getHabitsForGoal(goal.id);
        return (
          <div key={goal.id} className="card">
            <h3>{goal.name}</h3>
            {/* ... (other goal details) ... */}
            {goal.description && <p>{goal.description}</p>}
            {goal.targetDate && <p><strong>Target Date:</strong> {new Date(goal.targetDate).toLocaleDateString()}</p>}
            
            <div>
                <strong>Progress:</strong>
                <ProgressBar percentage={progress} />
            </div>
            
            <div>
                <strong>Habits in this Goal:</strong>
                {habitsInGoal.length > 0 ? (
                    <ul>
                        {habitsInGoal.map(h => <li key={h.id}>{h.name}</li>)}
                    </ul>
                ) : (
                    <p>No habits assigned to this goal yet.</p>
                )}
            </div>

            <div style={{ marginTop: '10px' }}>
              <button onClick={() => onEditGoal(goal)}>Edit</button>
              <button 
                className="secondary" 
                onClick={() => {
                  if (window.confirm(`Are you sure you want to archive goal "${goal.name}"? Habits assigned to it will be unassigned.`)) {
                    archiveGoal(goal.id);
                  }
                }}
                style={{ marginLeft: '5px' }}
              >
                Archive
              </button>
              <button 
                className="danger"
                onClick={() => {
                  if (window.confirm(`DANGER! Are you sure you want to PERMANENTLY DELETE goal "${goal.name}"? This action cannot be undone. Habits assigned to it will be unassigned.`)) {
                    permanentlyDeleteGoal(goal.id);
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

export default GoalList;