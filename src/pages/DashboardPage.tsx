// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useHabits } from '../contexts/HabitContext';
import { Habit, HabitInstance } from '../types';
import { format, parseISO, isToday, isPast, isFuture, startOfDay, isEqual as isEqualDates, formatISO } from 'date-fns';

export const formatMinutesToHoursMinutes = (totalMinutes: number): string => {
  if (isNaN(totalMinutes) || totalMinutes === 0) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  let result = "";
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || hours === 0) result += `${minutes}m`;
  return result.trim() || "0m";
};

const ItemProgressBar: React.FC<{ current: number; target: number; isTimeBased?: boolean }> = ({ current, target, isTimeBased }) => {
    if (target <= 0) return null; 
    const percentage = Math.min(100, Math.max(0, (current / target) * 100));
    const currentFormatted = isTimeBased ? formatMinutesToHoursMinutes(current) : current;
    const targetFormatted = isTimeBased ? formatMinutesToHoursMinutes(target) : target;
    
    return (
        <div style={{ marginBottom: '10px' }}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#555'}}>
                <span>{currentFormatted}</span>
                <span>{targetFormatted}</span>
            </div>
            <div className="progress-bar-container" style={{ height: '10px' }}>
                <div className="progress-bar-filler" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

interface DashboardHabitItemProps {
  instance: HabitInstance;
  habit: Habit;
  onLogQuantitative: (instanceId: string, habit: Habit, loggedTotalMinutesOrValue: number) => void;
  onResetQuantitative: (instanceId: string, habit: Habit) => void;
  onToggleNonQuantitative: (instanceId: string, currentStatus: boolean) => void;
  onUpdateNotes: (instanceId: string, notes: string) => void;
}

const DashboardHabitItem: React.FC<DashboardHabitItemProps> = ({ 
    instance, habit, 
    onLogQuantitative, onResetQuantitative, onToggleNonQuantitative, 
    onUpdateNotes 
}) => {
  const [tempNotes, setTempNotes] = useState(instance.notes || '');
  const [showNotesInput, setShowNotesInput] = useState(false);
  
  const [inputHours, setInputHours] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(0);
  const [inputValue, setInputValue] = useState<number | string>('');

  const TIME_UNIT_VALUE = 'time_duration_minutes';
  const isTimeBasedQuantitative = habit.isQuantitative && habit.quantitativeUnit === TIME_UNIT_VALUE;

  useEffect(() => {
    setTempNotes(instance.notes || '');
    if (habit.isQuantitative) {
        const currentVal = instance.quantitativeValue || 0;
        if (isTimeBasedQuantitative) {
            setInputHours(Math.floor(currentVal / 60));
            setInputMinutes(currentVal % 60);
        } else {
            setInputValue(currentVal);
        }
    } else {
        setInputHours(0); setInputMinutes(0); setInputValue('');
    }
  }, [instance.notes, instance.quantitativeValue, habit.isQuantitative, isTimeBasedQuantitative]);

  const handleNotesBlur = () => { 
    if (tempNotes !== instance.notes) { onUpdateNotes(instance.id, tempNotes); } 
    setShowNotesInput(false); 
  };

  const handleLogProgress = () => { 
    if (!habit.isQuantitative) return;
    let totalLoggedValue: number;
    if (isTimeBasedQuantitative) {
        totalLoggedValue = (inputHours * 60) + inputMinutes;
    } else {
        totalLoggedValue = parseFloat(String(inputValue));
        if (isNaN(totalLoggedValue)) { alert(`Please enter a valid number for ${habit.quantitativeUnit || 'value'}.`); return; }
    }
    onLogQuantitative(instance.id, habit, totalLoggedValue);
  };

  const handleResetQuantitativeClick = () => { 
    if (window.confirm(`Reset "${habit.name}"? This will mark it as not done and clear any logged value.`)) { 
        onResetQuantitative(instance.id, habit); 
    }
  };
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>, type: 'hours' | 'minutes' | 'value') => { 
    const valStr = e.target.value;
    if (type === 'hours') setInputHours(parseInt(valStr) || 0);
    else if (type === 'minutes') setInputMinutes(Math.min(59, Math.max(0, parseInt(valStr) || 0)));
    else if (type === 'value') setInputValue(valStr === '' ? '' : (isNaN(parseFloat(valStr)) ? inputValue : parseFloat(valStr)));
  };

  const itemStatus = (() => {
    const scheduled = parseISO(instance.scheduledDate);
    if (isToday(scheduled)) return { text: "Due Today", color: "#007bff" }; // Will be filtered if completed
    if (isPast(scheduled)) return { text: "Overdue", color: "red" }; // Will be filtered if completed
    if (isFuture(scheduled)) return { text: "Upcoming", color: "#ffc107" }; // Will be filtered if completed
    return { text: "Scheduled", color: "grey" };
  })();

  let itemClassName = "card";
  // Removed completed-habit styling logic here as it won't be shown if completed.
  // Overdue style can remain if item is not completed AND past due.
  if (!instance.completed && isPast(parseISO(instance.scheduledDate))) itemClassName += " overdue-habit";


  return (
    <div className={itemClassName} style={{marginBottom: '10px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <h4 style={{margin: '0 0 5px 0'}}>{habit.name}</h4>
        <span style={{ color: itemStatus.color, fontWeight: 'bold', fontSize: '0.8em' }}>({itemStatus.text})</span>
      </div>
      {habit.description && (
        <p style={{ fontSize: '0.85em', color: '#666', margin: '0 0 8px 0', whiteSpace: 'pre-wrap' }}>
          {habit.description}
        </p>
      )}

      {habit.isQuantitative && habit.targetValue !== undefined && habit.targetValue > 0 && (
        <ItemProgressBar current={instance.quantitativeValue || 0} target={habit.targetValue} isTimeBased={isTimeBasedQuantitative}/>
      )}
      {habit.isQuantitative && (
        <div>
          <p style={{marginBottom: '5px', fontSize: '0.8em'}}>
            Target: {isTimeBasedQuantitative && habit.targetValue ? formatMinutesToHoursMinutes(habit.targetValue) : `${habit.targetValue || 'N/A'} ${habit.quantitativeUnit || ''}`}
            {(instance.quantitativeValue || 0) > 0 && 
              <span> | Logged: {isTimeBasedQuantitative ? formatMinutesToHoursMinutes(instance.quantitativeValue!) : `${instance.quantitativeValue} ${habit.quantitativeUnit || ''}`}</span>
            }
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
            {isTimeBasedQuantitative ? (<> <input type="number" min="0" value={inputHours} onChange={(e) => handleInputChange(e, 'hours')} style={{width: '45px', fontSize:'0.9em'}} aria-label="Hours"/> <label style={{fontSize:'0.9em'}}>h</label> <input type="number" min="0" max="59" value={inputMinutes} onChange={(e) => handleInputChange(e, 'minutes')} style={{width: '45px', fontSize:'0.9em'}} aria-label="Minutes"/> <label style={{fontSize:'0.9em'}}>m</label> </>) 
            : (<input type="number" value={inputValue} onChange={(e) => handleInputChange(e, 'value')} placeholder={`Log ${habit.quantitativeUnit || 'value'}`} style={{width: '80px', fontSize:'0.9em'}}/> )}
            <button onClick={handleLogProgress} style={{fontSize:'0.9em', padding: '4px 8px'}}> {(instance.quantitativeValue || 0) > 0 ? 'Update' : 'Log'} </button>
          </div>
          {(instance.quantitativeValue || 0) > 0 && 
            <button onClick={handleResetQuantitativeClick} className="secondary" style={{fontSize: '0.7em', padding: '3px 6px', marginLeft: 'auto', display: 'block'}}> Reset </button>
          }
        </div>
      )}
      {!habit.isQuantitative && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <input type="checkbox" id={`cb-${instance.id}`} checked={false} onChange={() => onToggleNonQuantitative(instance.id, false)} style={{ marginRight: '8px', transform: 'scale(1.2)'}}/>
          <label htmlFor={`cb-${instance.id}`} style={{ fontWeight: 'bold', fontSize:'0.9em' }}>Mark as Done</label>
        </div>
      )}
       {(showNotesInput || (habit.isQuantitative && (instance.quantitativeValue || 0) > 0)) && (
        <div>
          {!showNotesInput && (<p style={{fontSize: '0.8em', color: '#555', cursor: 'pointer', margin:'5px 0'}} onClick={() => setShowNotesInput(true)}> Notes: {instance.notes ? <i>"{instance.notes}"</i> : "Add note..."} </p>)}
          {showNotesInput && (<textarea value={tempNotes} onChange={(e) => setTempNotes(e.target.value)} onBlur={handleNotesBlur} placeholder="Add a little note..." rows={1} style={{width: 'calc(100% - 12px)', fontSize:'0.8em', padding:'3px'}} autoFocus/>)}
        </div>
      )}
    </div>
  );
};

interface DailyHabitGroupProps {
  date: string; 
  items: { instance: HabitInstance, habit: Habit }[];
  onLogQuantitative: (instanceId: string, habit: Habit, loggedTotalValue: number) => void;
  onResetQuantitative: (instanceId: string, habit: Habit) => void;
  onToggleNonQuantitative: (instanceId: string, currentStatus: boolean) => void;
  onUpdateNotes: (instanceId: string, notes: string) => void;
}

const DailyHabitGroup: React.FC<DailyHabitGroupProps> = ({ 
  date, items, 
  onLogQuantitative, onResetQuantitative, onToggleNonQuantitative, onUpdateNotes 
}) => {
  const [isOpen, setIsOpen] = useState(isToday(parseISO(date))); 

  const displayDate = format(parseISO(date), 'EEEE, MMM d');
  const dayLabel = isToday(parseISO(date)) ? "Today" : displayDate;

  if (items.length === 0 && !isToday(parseISO(date))) { // Don't render group if no items and not today
      return null;
  }

  return (
    <div className="day-group card" style={{ backgroundColor: '#F8F9FA', marginBottom: '15px' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="day-group-header"
        style={{
            width: '100%', textAlign: 'left', padding: '10px 15px', 
            fontSize: '1.1em', fontWeight: 'bold', border: 'none', 
            background: isOpen ? '#E9ECEF' : '#F8F9FA',
            borderBottom: '1px solid #DEE2E6',
            cursor: 'pointer', display: 'flex', justifyContent: 'space-between'
        }}
      >
        {dayLabel}
        <span>{isOpen ? '▼' : '▶'} ({items.length} task{items.length !== 1 ? 's' : ''})</span>
      </button>
      {isOpen && (
        <div style={{ padding: '10px' }}>
          {items.length === 0 ? <p>No pending tasks for this day.</p> : 
            items.map(({ instance, habit }) => (
              <DashboardHabitItem
                key={instance.id}
                instance={instance}
                habit={habit}
                onLogQuantitative={onLogQuantitative}
                onResetQuantitative={onResetQuantitative}
                onToggleNonQuantitative={onToggleNonQuantitative}
                onUpdateNotes={onUpdateNotes}
              />
            ))
          }
        </div>
      )}
    </div>
  );
};


type GroupedHabits = Record<string, { instance: HabitInstance, habit: Habit }[]>;

const DashboardPage: React.FC = () => {
  const { 
    getTodaysHabitInstances, 
    getUpcomingHabitInstances, 
    markHabitInstanceComplete,
    habitInstances, 
  } = useHabits();

  const [todaysItems, setTodaysItems] = useState<{ instance: HabitInstance, habit: Habit }[]>([]);
  const [groupedUpcoming, setGroupedUpcoming] = useState<GroupedHabits>({});
  const [upcomingDaysOrder, setUpcomingDaysOrder] = useState<string[]>([]);


  const refreshDashboardData = useCallback(() => {
    const todayRaw = getTodaysHabitInstances();
    setTodaysItems(todayRaw.filter(item => !item.instance.completed));

    const upcomingRaw = getUpcomingHabitInstances(14); // This already filters completed items
    const grouped: GroupedHabits = {};
    
    upcomingRaw.forEach(item => { // No need to filter again here if context function is reliable
      const dateKey = formatISO(startOfDay(parseISO(item.instance.scheduledDate)), { representation: 'date' });
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });
    
    setGroupedUpcoming(grouped);
    setUpcomingDaysOrder(Object.keys(grouped).sort());

  }, [getTodaysHabitInstances, getUpcomingHabitInstances]);

  useEffect(() => {
    refreshDashboardData();
  }, [habitInstances, refreshDashboardData]); // habitInstances dependency triggers refresh

  const handleLogQuantitativeProgress = (instanceId: string, habit: Habit, loggedTotalValue: number) => {
    const currentInstance = habitInstances.find(i => i.id === instanceId);
    markHabitInstanceComplete(instanceId, null, loggedTotalValue, currentInstance?.notes);
  };
  const handleResetQuantitativeProgress = (instanceId: string, habit: Habit) => {
    const currentInstance = habitInstances.find(i => i.id === instanceId);
    markHabitInstanceComplete(instanceId, false, 0, currentInstance?.notes); // Pass false to un-complete
  };
  const handleToggleNonQuantitative = (instanceId: string, currentStatus: boolean) => {
    // For non-quantitative, currentStatus is always false for items shown (since completed are filtered)
    // So we are marking it as true (completed)
    const currentInstance = habitInstances.find(i => i.id === instanceId);
    markHabitInstanceComplete(instanceId, true, undefined, currentInstance?.notes);
  };
  const handleUpdateNotes = (instanceId: string, notesText: string) => {
    const inst = habitInstances.find(i => i.id === instanceId);
    if (inst) {
        // When updating notes, pass existing completion status and quantitative value
        // to avoid unintended changes if explicitCompletedOverride is null.
        // Or, determine completion status based on quant value again if needed.
        // Simpler: let explicitCompletedOverride be null if it's just notes.
        markHabitInstanceComplete(inst.id, null, inst.quantitativeValue, notesText);
    }
  };
  
  return (
    <div>
      <h2>Dashboard</h2>
      
      <DailyHabitGroup 
        date={formatISO(startOfDay(new Date()), { representation: 'date' })}
        items={todaysItems}
        onLogQuantitative={handleLogQuantitativeProgress}
        onResetQuantitative={handleResetQuantitativeProgress}
        onToggleNonQuantitative={handleToggleNonQuantitative}
        onUpdateNotes={handleUpdateNotes}
      />
      
      <h3 style={{marginTop: '30px'}}>Upcoming Habits</h3>
      {upcomingDaysOrder.length === 0 && todaysItems.length === 0 && ( // Show only if no tasks at all
        <p>No habits scheduled for today or the near future.</p>
      )}
      {upcomingDaysOrder.length > 0 && upcomingDaysOrder.map(dateKey => (
        <DailyHabitGroup
          key={dateKey}
          date={dateKey}
          items={groupedUpcoming[dateKey]?.filter(item => !item.instance.completed) || []} // Extra safe filter
          onLogQuantitative={handleLogQuantitativeProgress}
          onResetQuantitative={handleResetQuantitativeProgress}
          onToggleNonQuantitative={handleToggleNonQuantitative}
          onUpdateNotes={handleUpdateNotes}
        />
      ))}
    </div>
  );
};

export default DashboardPage;