// src/contexts/GoalContext.tsx
import React, { createContext, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Goal, Habit } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useHabits } from './HabitContext';
import { addDays, parseISO, isBefore, isEqual, startOfDay, isAfter as dateFnsIsAfter, isSameDay } from 'date-fns';

const isHabitDueOnDay = (habit: Habit, date: Date): boolean => {
    const habitStartDate = parseISO(habit.startDate);
    if (isBefore(date, startOfDay(habitStartDate))) return false;
  
    if (habit.endDate) {
      const habitEndDate = parseISO(habit.endDate);
      if (dateFnsIsAfter(startOfDay(date), startOfDay(habitEndDate))) return false;
    }
    
    const dayOfWeek = date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const dayOfMonth = date.getDate();
  
    switch (habit.frequency.type) {
      case 'daily':
        return true;
      case 'weekly':
        return habit.frequency.days.includes(dayOfWeek);
      case 'monthly':
        return habit.frequency.dayOfMonth === dayOfMonth;
      default:
        return false;
    }
};


interface GoalContextType {
  goals: Goal[];
  allGoals: Goal[];
  addGoal: (goalData: Omit<Goal, 'id' | 'createdAt' | 'archived' | 'archivedAt'>) => Goal;
  updateGoal: (goalId: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>) => void;
  archiveGoal: (goalId: string) => void;
  unarchiveGoal: (goalId: string) => void;
  permanentlyDeleteGoal: (goalId: string) => void;
  getGoalById: (goalId: string, includeArchived?: boolean) => Goal | undefined;
  getGoalProgress: (goalId: string) => number;
  getHabitsForGoal: (goalId: string) => Habit[];
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export const useGoals = () => {
  const context = useContext(GoalContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  return context;
};

export const GoalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rawGoals, setRawGoals] = useLocalStorage<Goal[]>('goals', []);
  const habitContext = useHabits();

  const activeGoals = useMemo(() => rawGoals.filter(g => !g.archived), [rawGoals]);

  useEffect(() => {
    if (!habitContext) {
        console.warn("HabitContext not yet available in GoalProvider.");
    }
  }, [habitContext]);


  const addGoal = useCallback((goalData: Omit<Goal, 'id' | 'createdAt' | 'archived' | 'archivedAt'>): Goal => {
    const newGoal: Goal = {
      ...goalData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      archived: false,
      archivedAt: undefined,
    };
    setRawGoals(prev => [...prev, newGoal]);
    return newGoal;
  }, [setRawGoals]);

  const updateGoal = useCallback((goalId: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>) => {
    setRawGoals(prev =>
      prev.map(g => {
        if (g.id === goalId) {
          const updatedGoalBase = { ...g, ...updates };
          let newArchivedAt = g.archivedAt;

          if ('archived' in updates) {
            if (updates.archived === true && !g.archived) {
              newArchivedAt = new Date().toISOString();
            } else if (updates.archived === false && g.archived) {
              newArchivedAt = undefined;
            }
          }
          return { 
            ...updatedGoalBase, 
            archived: 'archived' in updates ? updates.archived! : g.archived,
            archivedAt: newArchivedAt
          };
        }
        return g;
      })
    );
  }, [setRawGoals]);

  const unassignHabitsFromGoal = useCallback((goalId: string) => {
    if (!habitContext) return;
    const { allHabits, updateHabit: updateHabitInContext } = habitContext;
    allHabits.forEach(habit => {
      if (habit.goalId === goalId) {
        updateHabitInContext(habit.id, { ...habit, goalId: undefined });
      }
    });
  }, [habitContext]);

  const archiveGoal = useCallback((goalId: string) => {
    setRawGoals(prev => prev.map(g => g.id === goalId ? {...g, archived: true, archivedAt: new Date().toISOString()} : g));
    unassignHabitsFromGoal(goalId);
  }, [setRawGoals, unassignHabitsFromGoal]);

  const unarchiveGoal = useCallback((goalId: string) => {
    setRawGoals(prev => prev.map(g => g.id === goalId ? {...g, archived: false, archivedAt: undefined} : g));
  }, [setRawGoals]);

  const permanentlyDeleteGoal = useCallback((goalId: string) => {
    setRawGoals(prev => prev.filter(g => g.id !== goalId));
    unassignHabitsFromGoal(goalId);
  }, [setRawGoals, unassignHabitsFromGoal]);
  
  const getGoalById = useCallback((goalId: string, includeArchived: boolean = false) => {
    const source = includeArchived ? rawGoals : activeGoals;
    return source.find(g => g.id === goalId);
  }, [rawGoals, activeGoals]);

  const getHabitsForGoal = useCallback((goalId: string): Habit[] => {
    if (!habitContext) return [];
    return habitContext.habits.filter(habit => habit.goalId === goalId);
  }, [habitContext]);

  const calculateTotalPossibleInstances = useCallback((habit: Habit): number => {
      if (!habit.endDate || !habit.startDate) return 0; 
      const start = startOfDay(parseISO(habit.startDate));
      const end = startOfDay(parseISO(habit.endDate));
      let count = 0;
      let current = start;
      while (isBefore(current, end) || isEqual(current, end)) {
          if (isHabitDueOnDay(habit, current)) {
              count++;
          }
          current = addDays(current, 1);
      }
      return count;
  }, []); 

  const getGoalProgress = useCallback((goalId: string): number => {
    if (!habitContext) return 0;
    const relevantHabits = getHabitsForGoal(goalId);
    if (relevantHabits.length === 0) return 0;

    let sumOfIndividualHabitProgresses = 0;

    relevantHabits.forEach(habit => {
      let individualHabitProgress = 0;

      if (!habit.endDate) { 
        const today = startOfDay(new Date());
        const allInstancesForHabit = habitContext.getInstancesForHabit(habit.id, true);
        const todaysInstance = allInstancesForHabit.find(inst =>
            isSameDay(parseISO(inst.scheduledDate), today)
        );

        if (todaysInstance && todaysInstance.completed) {
            individualHabitProgress = 100;
        } else {
            individualHabitProgress = 0;
        }
      } else { 
        const instances = habitContext.getInstancesForHabit(habit.id, true); 
        const completedInstancesCount = instances.filter(inst => inst.completed).length;
        
        const totalPossible = calculateTotalPossibleInstances(habit);
        if (totalPossible > 0) {
          individualHabitProgress = (completedInstancesCount / totalPossible) * 100;
        }
      }
      
      sumOfIndividualHabitProgresses += Math.min(100, Math.max(0, individualHabitProgress)); 
    });
    
    return sumOfIndividualHabitProgresses / relevantHabits.length;
  }, [habitContext, getHabitsForGoal, calculateTotalPossibleInstances]);


  return (
    <GoalContext.Provider value={{ 
        goals: activeGoals, 
        allGoals: rawGoals,
        addGoal, 
        updateGoal, 
        archiveGoal,
        unarchiveGoal,
        permanentlyDeleteGoal,
        getGoalById,
        getGoalProgress,
        getHabitsForGoal
    }}>
      {children}
    </GoalContext.Provider>
  );
};