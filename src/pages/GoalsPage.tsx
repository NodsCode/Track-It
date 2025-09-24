// src/pages/GoalsPage.tsx
import React, { useState } from 'react';
import { Goal } from '../types';
import GoalForm from '../features/goals/GoalForm'; // To be created
import GoalList from '../features/goals/GoalList'; // To be created

const GoalsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };
  
  const handleFormClose = () => {
    setShowForm(false);
    setEditingGoal(null);
  }

  return (
    <div>
      <h2>Manage Goals</h2>
      <button onClick={() => { setEditingGoal(null); setShowForm(true); }}>Add New Goal</button>
      {showForm && (
         <GoalForm 
             existingGoal={editingGoal}
             onClose={handleFormClose}
         />
      )}
      <GoalList onEditGoal={handleEditGoal} />
    </div>
  );
};

export default GoalsPage;