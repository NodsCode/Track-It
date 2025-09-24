// src/contexts/HabitContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Habit, HabitInstance, FrequencyConfig } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
  addDays, 
  addWeeks,
  addMonths,
  formatISO, 
  parseISO, 
  isBefore, 
  isAfter, 
  isEqual, 
  startOfDay,
  isSameDay,
  subDays 
} from 'date-fns';

const UPCOMING_DAYS_TO_GENERATE = 7; 
const INSTANCE_PRUNE_DAYS_OLD = 30; 

export interface HabitContextType {
  habits: Habit[]; 
  allHabits: Habit[]; 
  habitInstances: HabitInstance[];
  addHabit: (habitData: Omit<Habit, 'id' | 'createdAt' | 'archived' | 'archivedAt' | 'endDate'>) => Habit;
  updateHabit: (habitId: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => void;
  archiveHabit: (habitId: string) => void;
  unarchiveHabit: (habitId: string) => void; 
  permanentlyDeleteHabit: (habitId: string) => void;
  getHabitById: (habitId: string, includeArchived?: boolean) => Habit | undefined;
  getInstancesForHabit: (habitId: string, includeCompleted?: boolean) => HabitInstance[];
  getInstancesForDate: (date: Date) => HabitInstance[];
  markHabitInstanceComplete: (
    instanceId: string, 
    explicitCompletedOverride: boolean | null,
    quantitativeValueLogged?: number, 
    notes?: string
  ) => void;
  generateAndPruneInstances: () => void;
  getUpcomingHabitInstances: (limit?: number) => { instance: HabitInstance, habit: Habit }[];
  getTodaysHabitInstances: () => { instance: HabitInstance, habit: Habit }[];
}

export const calculateEndDate = (startDateISO: string, duration?: Habit['duration']): string | undefined => {
  if (!duration || duration.value <= 0) return undefined;
  
  let endDate = parseISO(startDateISO);
  if (duration.unit === 'days') {
    endDate = addDays(endDate, duration.value - 1);
  } else if (duration.unit === 'weeks') {
    endDate = addWeeks(endDate, duration.value);
    endDate = addDays(endDate, -1); 
  } else if (duration.unit === 'months') {
    endDate = addMonths(endDate, duration.value);
    endDate = addDays(endDate, -1);
  }
  return formatISO(startOfDay(endDate)); 
};

const isHabitDue = (habit: Habit, dateToCheck: Date): boolean => {
  const normalizedDateToCheck = startOfDay(dateToCheck);
  const habitStartDate = startOfDay(parseISO(habit.startDate));

  if (isBefore(normalizedDateToCheck, habitStartDate)) return false;

  if (habit.endDate) {
    const habitEndDate = startOfDay(parseISO(habit.endDate));
    if (isAfter(normalizedDateToCheck, habitEndDate)) return false;
  }
  
  const dayOfWeek = normalizedDateToCheck.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const dayOfMonth = normalizedDateToCheck.getDate();

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

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};

export const HabitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rawHabits, setRawHabits] = useLocalStorage<Habit[]>('habits', []);
  const [habitInstances, setHabitInstances] = useLocalStorage<HabitInstance[]>('habitInstances', []);

  const activeHabits = useMemo(() => rawHabits.filter(h => !h.archived), [rawHabits]);

  const getHabitByIdLocal = useCallback((habitId: string, includeArchived: boolean = false): Habit | undefined => {
    const source = includeArchived ? rawHabits : activeHabits;
    return source.find(h => h.id === habitId);
  }, [rawHabits, activeHabits]);


  const generateAndPruneInstances = useCallback(() => {
    const today = startOfDay(new Date());
    const currentActiveHabits = rawHabits.filter(h => !h.archived); 
    let currentStoredInstances = [...habitInstances];

    const pruneDateThreshold = subDays(today, INSTANCE_PRUNE_DAYS_OLD);
    currentStoredInstances = currentStoredInstances.filter(inst => {
        const scheduled = startOfDay(parseISO(inst.scheduledDate));
        return inst.completed || !isBefore(scheduled, pruneDateThreshold);
    });

    const newInstancesToCreate: HabitInstance[] = [];
    const existingInstanceKeys = new Set(
        currentStoredInstances.map(inst => `${inst.habitId}-${formatISO(startOfDay(parseISO(inst.scheduledDate)), { representation: 'date' })}`)
    );

    for (let i = 0; i < UPCOMING_DAYS_TO_GENERATE; i++) {
      const dateToGenerateFor = startOfDay(addDays(today, i));
      const dateToGenerateForStr = formatISO(dateToGenerateFor, { representation: 'date' });

      currentActiveHabits.forEach(habit => {
        const instanceKey = `${habit.id}-${dateToGenerateForStr}`;
        if (!existingInstanceKeys.has(instanceKey) && isHabitDue(habit, dateToGenerateFor)) {
          newInstancesToCreate.push({
            id: uuidv4(),
            habitId: habit.id,
            scheduledDate: formatISO(dateToGenerateFor),
            completed: false,
          });
          existingInstanceKeys.add(instanceKey);
        }
      });
    }
    
    if (newInstancesToCreate.length > 0 || currentStoredInstances.length !== habitInstances.length) {
        setHabitInstances([...currentStoredInstances, ...newInstancesToCreate]);
    }
  }, [rawHabits, habitInstances, setHabitInstances]); 

  useEffect(() => {
    generateAndPruneInstances();
  }, [rawHabits, generateAndPruneInstances]);


  const addHabit = useCallback((habitData: Omit<Habit, 'id' | 'createdAt' | 'archived' | 'archivedAt' | 'endDate'>): Habit => {
    const newHabit: Habit = {
      ...habitData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      archived: false,
      archivedAt: undefined,
      endDate: calculateEndDate(habitData.startDate, habitData.duration),
    };
    setRawHabits(prev => [...prev, newHabit]);
    return newHabit;
  }, [setRawHabits]);

  const updateHabit = useCallback((habitId: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => {
    setRawHabits(prev =>
      prev.map(h => {
        if (h.id === habitId) {
          const updatedHabitBase = { ...h, ...updates };
          const newStartDate = updates.startDate || h.startDate;
          const newDuration = 'duration' in updates ? updates.duration : h.duration;
          
          let newArchivedAt = h.archivedAt;
          if ('archived' in updates) {
            if (updates.archived === true && !h.archived) {
              newArchivedAt = new Date().toISOString();
            } else if (updates.archived === false && h.archived) {
              newArchivedAt = undefined;
            }
          }
          
          return {
             ...updatedHabitBase,
             archived: 'archived' in updates ? updates.archived! : h.archived,
             archivedAt: newArchivedAt,
             endDate: calculateEndDate(newStartDate, newDuration)
          };
        }
        return h;
      })
    );
  }, [setRawHabits]);

  const archiveHabit = useCallback((habitId: string) => {
    setRawHabits(prev => prev.map(h => h.id === habitId ? {...h, archived: true, archivedAt: new Date().toISOString()} : h));
    setHabitInstances(prev => prev.filter(inst => {
        if (inst.habitId === habitId) {
            const scheduledDate = parseISO(inst.scheduledDate);
            return inst.completed || isBefore(scheduledDate, startOfDay(new Date()));
        }
        return true;
    }));
  }, [setRawHabits, setHabitInstances]);

  const unarchiveHabit = useCallback((habitId: string) => {
    setRawHabits(prev => prev.map(h => h.id === habitId ? {...h, archived: false, archivedAt: undefined} : h));
  }, [setRawHabits]);

  const permanentlyDeleteHabit = useCallback((habitId: string) => {
    setRawHabits(prev => prev.filter(h => h.id !== habitId));
    setHabitInstances(prev => prev.filter(inst => inst.habitId !== habitId));
  }, [setRawHabits, setHabitInstances]);
  
  const getInstancesForHabit = useCallback((habitId: string, includeCompleted: boolean = true) => {
    return habitInstances.filter(inst => 
        inst.habitId === habitId && (includeCompleted || !inst.completed)
    );
  }, [habitInstances]);
  
  const getInstancesForDate = useCallback((date: Date) => {
    const targetDayStart = startOfDay(date);
    return habitInstances.filter(inst => 
        isSameDay(parseISO(inst.scheduledDate), targetDayStart)
    );
  }, [habitInstances]);

  const markHabitInstanceComplete = useCallback((
    instanceId: string,
    explicitCompletedOverride: boolean | null,
    quantitativeValueLogged?: number,
    notes?: string
  ) => {
    setHabitInstances(prevInstances =>
      prevInstances.map(inst => {
        if (inst.id === instanceId) {
          const habit = getHabitByIdLocal(inst.habitId);
          if (!habit) return inst;

          let finalCompletedStatus = inst.completed;
          let newQuantitativeValue = habit.isQuantitative ? (inst.quantitativeValue ?? 0) : undefined;
          const newNotes = notes === undefined ? inst.notes : notes;

          if (explicitCompletedOverride === false) {
            finalCompletedStatus = false;
            if (habit.isQuantitative) {
              newQuantitativeValue = 0; 
            }
          } else if (habit.isQuantitative) {
            if (quantitativeValueLogged !== undefined) {
              newQuantitativeValue = quantitativeValueLogged;
            }
            if (habit.targetValue && habit.targetValue > 0) {
              finalCompletedStatus = newQuantitativeValue >= habit.targetValue;
            } else {
              finalCompletedStatus = newQuantitativeValue > 0;
            }
          } else { // Non-quantitative
            if (explicitCompletedOverride === true) {
              finalCompletedStatus = true;
            }
          }
          
          return {
            ...inst,
            completed: finalCompletedStatus,
            completionDate: finalCompletedStatus ? (inst.completionDate || new Date().toISOString()) : undefined,
            quantitativeValue: habit.isQuantitative ? newQuantitativeValue : undefined,
            notes: newNotes,
          };
        }
        return inst;
      })
    );
  }, [setHabitInstances, getHabitByIdLocal]);


  const getTodaysHabitInstances = useCallback(() => {
    const todayStart = startOfDay(new Date());
    return habitInstances
      .filter(inst => {
          const habit = getHabitByIdLocal(inst.habitId); 
          return habit && !habit.archived && isSameDay(parseISO(inst.scheduledDate), todayStart); // Ensure habit is active
      })
      .map(instance => ({ instance, habit: getHabitByIdLocal(instance.habitId) as Habit }))
      .filter(item => !!item.habit); 
  }, [habitInstances, getHabitByIdLocal]);

  const getUpcomingHabitInstances = useCallback((limit: number = 5) => {
    const todayStart = startOfDay(new Date());
    return habitInstances
      .filter(inst => {
        const habit = getHabitByIdLocal(inst.habitId);
        if (!habit || habit.archived) return false; // Ensure habit is active
        const scheduledDate = parseISO(inst.scheduledDate);
        // Filter out completed instances and instances scheduled for today or past
        return !inst.completed && isAfter(scheduledDate, todayStart); 
      })
      .sort((a, b) => parseISO(a.scheduledDate).getTime() - parseISO(b.scheduledDate).getTime())
      .slice(0, limit)
      .map(instance => ({ instance, habit: getHabitByIdLocal(instance.habitId) as Habit }))
      .filter(item => !!item.habit); 
  }, [habitInstances, getHabitByIdLocal]);

  return (
    <HabitContext.Provider value={{ 
        habits: activeHabits,
        allHabits: rawHabits,
        habitInstances, 
        addHabit, 
        updateHabit, 
        archiveHabit,
        unarchiveHabit,
        permanentlyDeleteHabit,
        getHabitById: getHabitByIdLocal,
        getInstancesForHabit,
        getInstancesForDate,
        markHabitInstanceComplete,
        generateAndPruneInstances,
        getUpcomingHabitInstances,
        getTodaysHabitInstances
    }}>
      {children}
    </HabitContext.Provider>
  );
};