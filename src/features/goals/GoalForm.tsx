// src/features/goals/GoalForm.tsx
import React, { useState, useEffect } from 'react';
import { Goal } from '../../types';
import { useGoals } from '../../contexts/GoalContext';
import { formatISO, parseISO } from 'date-fns';

interface GoalFormProps {
  existingGoal?: Goal | null;
  onClose: () => void;
}

const GoalForm: React.FC<GoalFormProps> = ({ existingGoal, onClose }) => {
  const { addGoal, updateGoal } = useGoals();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (existingGoal) {
      setName(existingGoal.name);
      setDescription(existingGoal.description || '');
      setTargetDate(existingGoal.targetDate ? formatISO(parseISO(existingGoal.targetDate), { representation: 'date' }) : undefined);
    } else {
      setName('');
      setDescription('');
      setTargetDate(undefined);
    }
  }, [existingGoal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Goal name is required.");
      return;
    }
    const goalData = {
      name,
      description,
      targetDate: targetDate ? parseISO(targetDate).toISOString() : undefined,
    };

    if (existingGoal) {
      updateGoal(existingGoal.id, goalData);
    } else {
      addGoal(goalData as Omit<Goal, 'id' | 'createdAt' | 'archived'>);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content card" style={{maxWidth: '500px', margin: '20px auto'}}>
        <h3>{existingGoal ? 'Edit Goal' : 'Add New Goal'}</h3>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="goalName">Goal Name:</label>
            <input type="text" id="goalName" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="goalDescription">Description (optional):</label>
            <textarea id="goalDescription" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label htmlFor="targetDate">Target Completion Date (optional):</label>
            <input type="date" id="targetDate" value={targetDate || ''} onChange={e => setTargetDate(e.target.value)} />
          </div>
          <button type="submit">{existingGoal ? 'Save Changes' : 'Add Goal'}</button>
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default GoalForm;