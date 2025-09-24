// src/pages/HabitsPage.tsx
import React, { useState } from 'react';
import { useHabits } from '../contexts/HabitContext';
import HabitForm from '../features/habits/HabitForm'; // To be created
import HabitList from '../features/habits/HabitList'; // To be created
import { Habit } from '../types';

const HabitsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingHabit(null);
  }

  return (
    <div>
      <h2>Manage Habits</h2>
      <button onClick={() => { setEditingHabit(null); setShowForm(true); }}>Add New Habit</button>
      {showForm && (
        <HabitForm 
          existingHabit={editingHabit} 
          onClose={handleFormClose} 
        />
      )}
      <HabitList onEditHabit={handleEditHabit} />
    </div>
  );
};

export default HabitsPage;