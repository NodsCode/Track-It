// src/types/index.ts

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday

export interface FrequencyDaily {
  type: 'daily';
}

export interface FrequencyWeekly {
  type: 'weekly';
  days: DayOfWeek[]; 
}

export interface FrequencyMonthly {
  type: 'monthly';
  dayOfMonth: number; 
}

export type FrequencyConfig = FrequencyDaily | FrequencyWeekly | FrequencyMonthly;

// No specific QuantitativeUnitType union is strictly needed anymore for this simplified approach.
// The string itself will identify the unit.

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon?: string; 
  color?: string; 

  frequency: FrequencyConfig;
  startDate: string; 
  
  duration?: { 
    value: number; 
    unit: 'days' | 'weeks' | 'months'; 
  };
  endDate?: string; 

  isQuantitative: boolean;
  /**
   * If isQuantitative is true:
   * - If the habit tracks time, this will be a specific constant like 'time_duration_minutes'.
   * - If the habit tracks other numeric values, this will be the user-defined unit name (e.g., "pages", "km", "reps").
   */
  quantitativeUnit?: string; 
  /**
   * If isQuantitative is true:
   * - If quantitativeUnit is 'time_duration_minutes', targetValue is total minutes.
   * - Otherwise, targetValue is the numeric target for the custom unit.
   */
  targetValue?: number; 

  goalId?: string | null; 
  
  createdAt: string; 
  archived: boolean; 
  archivedAt?: string; // Added for tracking archival date
}

export interface HabitInstance {
  id: string; 
  habitId: string;
  scheduledDate: string; 
  completed: boolean;
  completionDate?: string; 
  /**
   * If the parent habit isQuantitative:
   * - If quantitativeUnit was 'time_duration_minutes', quantitativeValue is total minutes logged.
   * - Otherwise, quantitativeValue is the numeric value logged for the custom unit.
   */
  quantitativeValue?: number; 
  notes?: string; 
}

export interface Goal {
  id: string;
  name: string;
  description?: string;
  targetDate?: string; 
  createdAt: string; 
  archived: boolean;
  archivedAt?: string; // Added for tracking archival date
}

// For stats and archive
export interface CompletedHabitLog extends Habit {
  completionInstances: HabitInstance[];
  finalStatus: 'completed' | 'abandoned'; 
}

export interface CompletedGoalLog extends Goal {
  finalHabitStats: Array<{ habitName: string, habitId: string, completionRate: number }>;
  overallProgress: number;
}