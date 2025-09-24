// src/features/habits/HabitForm.tsx
import React, { useState, useEffect, ChangeEvent } from 'react';
import { Habit, FrequencyConfig, DayOfWeek, Goal } from '../../types';
import { useHabits } from '../../contexts/HabitContext';
import { useGoals } from '../../contexts/GoalContext';
import { formatISO, parseISO } from 'date-fns';

interface HabitFormProps {
  existingHabit?: Habit | null;
  onClose: () => void;
}

const initialFrequency: FrequencyConfig = { type: 'daily' };

// Simplified Unit Type selection
const UNIT_TYPES = [
    { value: '', label: 'Select Unit Type (Optional)'},
    { value: 'time_duration_minutes', label: 'Time (Hours & Minutes)' },
    { value: 'other_numeric', label: 'Other Numeric (e.g., pages, km, reps)' },
];
const TIME_UNIT_VALUE = 'time_duration_minutes'; // Constant for easy checking

const HabitForm: React.FC<HabitFormProps> = ({ existingHabit, onClose }) => {
  const { addHabit, updateHabit } = useHabits();
  const { goals } = useGoals();

  // --- Standard Habit States ---
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<FrequencyConfig>(initialFrequency);
  const [weeklyDays, setWeeklyDays] = useState<DayOfWeek[]>([]);
  const [monthlyDay, setMonthlyDay] = useState<number>(1);
  const [startDate, setStartDate] = useState(formatISO(new Date(), { representation: 'date' }));
  const [hasDuration, setHasDuration] = useState(false);
  const [durationValue, setDurationValue] = useState(30);
  const [durationUnit, setDurationUnit] = useState<'days' | 'weeks' | 'months'>('days');
  const [goalId, setGoalId] = useState<string | null>(null);
  
  // --- Quantitative Specific States ---
  const [isQuantitative, setIsQuantitative] = useState(false);
  const [selectedUnitType, setSelectedUnitType] = useState<string>(''); // 'time_duration_minutes' or 'other_numeric'
  const [customUnitName, setCustomUnitName] = useState(''); // For 'other_numeric' unit's actual name
  
  const [targetValueForOther, setTargetValueForOther] = useState<string>(''); // Target for 'other_numeric'
  const [targetHours, setTargetHours] = useState<string>('0');    // Target H for 'time'
  const [targetMinutes, setTargetMinutes] = useState<string>('0');  // Target M for 'time'


  useEffect(() => {
    if (existingHabit) {
      setName(existingHabit.name);
      setDescription(existingHabit.description || '');
      setFrequency(existingHabit.frequency);
      if (existingHabit.frequency.type === 'weekly') setWeeklyDays(existingHabit.frequency.days);
      if (existingHabit.frequency.type === 'monthly') setMonthlyDay(existingHabit.frequency.dayOfMonth);
      setStartDate(formatISO(parseISO(existingHabit.startDate), { representation: 'date' }));
      setHasDuration(!!existingHabit.duration);
      if (existingHabit.duration) {
        setDurationValue(existingHabit.duration.value);
        setDurationUnit(existingHabit.duration.unit);
      }
      setGoalId(existingHabit.goalId || null);
      
      setIsQuantitative(existingHabit.isQuantitative);
      const currentQuantUnitStored = existingHabit.quantitativeUnit || '';

      if (existingHabit.isQuantitative) {
        if (currentQuantUnitStored === TIME_UNIT_VALUE) {
            setSelectedUnitType(TIME_UNIT_VALUE);
            setCustomUnitName(''); // Clear custom name if it was time
            if (existingHabit.targetValue !== undefined) {
                setTargetHours(String(Math.floor(existingHabit.targetValue / 60)));
                setTargetMinutes(String(existingHabit.targetValue % 60));
            } else {
                setTargetHours('0'); setTargetMinutes('0');
            }
            setTargetValueForOther('');
        } else { // Assumed 'other_numeric' if quantitative and not TIME_UNIT_VALUE
            setSelectedUnitType('other_numeric');
            setCustomUnitName(currentQuantUnitStored); // The stored unit IS the custom name
            if (existingHabit.targetValue !== undefined) {
                setTargetValueForOther(String(existingHabit.targetValue));
            } else {
                setTargetValueForOther('');
            }
            setTargetHours('0'); setTargetMinutes('0');
        }
      } else { // Not quantitative
        setSelectedUnitType('');
        setCustomUnitName('');
        setTargetValueForOther('');
        setTargetHours('0');
        setTargetMinutes('0');
      }
    } else { // New Habit Defaults
      setName(''); setDescription(''); setFrequency(initialFrequency);
      setWeeklyDays([]); setMonthlyDay(1);
      setStartDate(formatISO(new Date(), { representation: 'date' }));
      setHasDuration(false); setDurationValue(30); setDurationUnit('days');
      setGoalId(null);
      setIsQuantitative(false); setSelectedUnitType(''); setCustomUnitName('');
      setTargetValueForOther(''); setTargetHours('0'); setTargetMinutes('0');
    }
  }, [existingHabit]);


  const handleFrequencyTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as FrequencyConfig['type'];
    if (type === 'daily') setFrequency({ type: 'daily' });
    else if (type === 'weekly') setFrequency({ type: 'weekly', days: weeklyDays });
    else if (type === 'monthly') setFrequency({ type: 'monthly', dayOfMonth: monthlyDay });
  };

  const handleWeeklyDayChange = (day: DayOfWeek) => {
    const newDays = weeklyDays.includes(day) ? weeklyDays.filter(d => d !== day) : [...weeklyDays, day];
    setWeeklyDays(newDays);
    // This useEffect below will handle updating the frequency object
  };
  
  // Update frequency object when its sub-properties change
  useEffect(() => {
     if (frequency.type === 'weekly') {
        setFrequency(prev => ({...prev, type: 'weekly', days: weeklyDays}));
     } else if (frequency.type === 'monthly') {
        setFrequency(prev => ({...prev, type: 'monthly', dayOfMonth: monthlyDay}));
     }
     // No need to list `frequency` in deps here, as it would cause a loop.
     // This effect is purely for syncing sub-states into the main frequency object.
  }, [weeklyDays, monthlyDay]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Habit name is required.");
      return;
    }
    if (frequency.type === 'weekly' && weeklyDays.length === 0) {
      alert("Please select at least one day for weekly frequency.");
      return;
    }
    
    let finalTargetValue: number | undefined = undefined;
    let finalQuantitativeUnit: string | undefined = undefined;

    if (isQuantitative) {
        if (selectedUnitType === TIME_UNIT_VALUE) {
            finalQuantitativeUnit = TIME_UNIT_VALUE;
            const th = parseInt(targetHours, 10) || 0;
            const tm = parseInt(targetMinutes, 10) || 0;
            const totalMinutes = (th * 60) + tm;
            if (totalMinutes > 0) finalTargetValue = totalMinutes;
        } else if (selectedUnitType === 'other_numeric') {
            if (!customUnitName.trim()) {
                alert("Please provide a name for your numeric unit (e.g., pages, km).");
                return;
            }
            finalQuantitativeUnit = customUnitName.trim();
            const tv = parseFloat(targetValueForOther);
            if (!isNaN(tv) && tv > 0) {
                finalTargetValue = tv;
            }
        } else if (!selectedUnitType && isQuantitative) { // Quantitative but no unit type selected
            alert("Please select a unit type for your quantitative habit or uncheck 'Is Quantitative'.");
            return;
        }
    }
    
    const habitData = {
      name, description, frequency,
      startDate: parseISO(startDate).toISOString(), 
      duration: hasDuration ? { value: durationValue, unit: durationUnit } : undefined,
      isQuantitative,
      quantitativeUnit: finalQuantitativeUnit,
      targetValue: finalTargetValue,
      goalId: goalId || undefined, 
    };

    if (existingHabit) {
      updateHabit(existingHabit.id, habitData as Partial<Omit<Habit, 'id' | 'createdAt' | 'archived'>>);
    } else {
      addHabit(habitData as Omit<Habit, 'id' | 'createdAt' | 'archived' | 'endDate'>);
    }
    onClose();
  };
  
  const daysOfWeek: {label: string, value: DayOfWeek}[] = [ /* ...days... */ { label: 'Sun', value: 0 }, { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 }, { label: 'Wed', value: 3 }, { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 }];

  const handleTimeInputChange = (e: ChangeEvent<HTMLInputElement>, type: 'hours' | 'minutes') => {
    const value = e.target.value;
    if (type === 'hours') {
        setTargetHours(value);
    } else if (type === 'minutes') {
        const numVal = parseInt(value, 10);
        setTargetMinutes(value === '' ? '' : String(isNaN(numVal) ? 0 : Math.min(59, Math.max(0, numVal))));
    }
  };

  const handleUnitTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newUnitType = e.target.value;
    setSelectedUnitType(newUnitType);
    // Clear all target inputs when unit type changes, user will re-enter
    setTargetHours('0');
    setTargetMinutes('0');
    setTargetValueForOther('');
    if (newUnitType !== 'other_numeric') {
        setCustomUnitName(''); // Clear custom name if not 'other_numeric'
    }
  };

  return (
    <div className="modal-backdrop"> 
      <div className="modal-content card" style={{maxWidth: '500px', margin: '20px auto', maxHeight: '90vh', overflowY: 'auto'}}>
        <h3>{existingHabit ? 'Edit Habit' : 'Add New Habit'}</h3>
        <form onSubmit={handleSubmit}>
          {/* Standard fields: Name, Description, Start Date, Frequency, Duration */}
          <div><label htmlFor="name">Habit Name:</label><input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required /></div>
          <div><label htmlFor="description">Description (optional):</label><textarea id="description" value={description} onChange={e => setDescription(e.target.value)} /></div>
          <div><label htmlFor="startDate">Start Date:</label><input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} required /></div>
          <div><label htmlFor="frequencyType">Frequency:</label><select id="frequencyType" value={frequency.type} onChange={handleFrequencyTypeChange}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
          {frequency.type === 'weekly' && (<div><label>Select Days:</label>{daysOfWeek.map(day => (<label key={day.value} style={{ marginRight: '10px', fontWeight: 'normal', display: 'inline-block' }}><input type="checkbox" checked={weeklyDays.includes(day.value)} onChange={() => handleWeeklyDayChange(day.value)}/> {day.label}</label>))}</div>)}
          {frequency.type === 'monthly' && (<div><label htmlFor="monthlyDay">Day of Month (1-31):</label><input type="number" id="monthlyDay" min="1" max="31" value={monthlyDay} onChange={e => setMonthlyDay(parseInt(e.target.value))} /></div>)}
          <div><label><input type="checkbox" checked={hasDuration} onChange={e => setHasDuration(e.target.checked)} /> Set a duration?</label></div>
          {hasDuration && (<><div /* Duration Value */><label htmlFor="durationValue">Value:</label><input type="number"id="durationValue" min="1" value={durationValue} onChange={e => setDurationValue(parseInt(e.target.value))} /></div><div /* Duration Unit */><label htmlFor="durationUnit">Unit:</label><select id="durationUnit" value={durationUnit} onChange={e => setDurationUnit(e.target.value as any)}><option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option></select></div></>)}
          
          <hr style={{margin: '15px 0'}} />
          <div> {/* Quantitative Checkbox */}
            <label>
              <input type="checkbox" checked={isQuantitative} onChange={e => setIsQuantitative(e.target.checked)} />
              Is this habit quantitative? (Track numbers, time, etc.)
            </label>
          </div>

          {isQuantitative && (
            <>
              <div> {/* Unit Type Dropdown */}
                <label htmlFor="quantitativeUnitTypeSelect">Unit Type:</label>
                <select 
                    id="quantitativeUnitTypeSelect" 
                    value={selectedUnitType} 
                    onChange={handleUnitTypeChange}
                >
                    {UNIT_TYPES.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                </select>
              </div>

              {selectedUnitType === TIME_UNIT_VALUE && (
                  <div> {/* Target H/M Inputs for Time */}
                      <label>Target Duration (optional):</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <input type="number" min="0" value={targetHours} onChange={(e) => handleTimeInputChange(e, 'hours')} style={{width: '60px'}} aria-label="Target Hours"/> h
                          <input type="number" min="0" max="59" value={targetMinutes} onChange={(e) => handleTimeInputChange(e, 'minutes')} style={{width: '60px'}} aria-label="Target Minutes"/> m
                      </div>
                      <p style={{fontSize: '0.8em', color: 'gray'}}>Total target will be sum of hours and minutes.</p>
                  </div>
              )}

              {selectedUnitType === 'other_numeric' && (
                <>
                  <div> {/* Custom Unit Name for Other Numeric */}
                    <label htmlFor="customUnitName">Name of Unit (e.g., pages, reps, km):</label>
                    <input 
                        type="text" 
                        id="customUnitName" 
                        value={customUnitName} 
                        onChange={e => setCustomUnitName(e.target.value)}
                        placeholder="Required, e.g., pages" 
                    />
                  </div>
                  <div> {/* Target Value for Other Numeric */}
                    <label htmlFor="targetValueForOther">Target Value (optional):</label>
                    <input 
                        type="number" 
                        id="targetValueForOther" 
                        value={targetValueForOther} 
                        onChange={e => setTargetValueForOther(e.target.value)} 
                        placeholder={`e.g., 10`} 
                        min="0"
                    />
                  </div>
                </>
              )}
            </>
          )}
          
          <hr style={{margin: '15px 0'}} />
          <div> {/* Goal Assignment */}
             <label htmlFor="goalId">Assign to Goal (optional):</label>
             <select id="goalId" value={goalId || ''} onChange={e => setGoalId(e.target.value || null)}>
                 <option value="">None</option>
                 {goals.map(goal => (<option key={goal.id} value={goal.id}>{goal.name}</option>))}
             </select>
          </div>

          <div style={{marginTop: '20px'}}> {/* Submit/Cancel Buttons */}
            <button type="submit">{existingHabit ? 'Save Changes' : 'Add Habit'}</button>
            <button type="button" className="secondary" onClick={onClose} style={{marginLeft: '10px'}}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HabitForm;