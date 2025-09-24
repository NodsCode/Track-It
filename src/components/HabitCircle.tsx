// src/components/HabitCircle.tsx
import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useHabits } from '../contexts/HabitContext';
import { isBefore, isEqual, parseISO, startOfDay } from 'date-fns';

const HabitCircle: React.FC = () => {
  const { habitInstances } = useHabits();

  const today = startOfDay(new Date());

  const relevantInstances = habitInstances.filter(inst => {
    const scheduledDate = startOfDay(parseISO(inst.scheduledDate));
    // Include instances scheduled for today or any day before today
    return isBefore(scheduledDate, today) || isEqual(scheduledDate, today);
  });

  const completedRelevantInstances = relevantInstances.filter(inst => inst.completed).length;
  const totalRelevantInstances = relevantInstances.length;

  const percentage = totalRelevantInstances === 0 ? 0 : (completedRelevantInstances / totalRelevantInstances) * 100;

  return (
    <div style={{ width: 120, height: 120, margin: "0 auto" }}> {/* Added margin for centering if in a flex container */}
      <CircularProgressbar
        value={percentage}
        text={`${Math.round(percentage)}%`}
        styles={buildStyles({
          pathColor: "#558B2F", // Theme consistent green
          textColor: "#4A3B31", // Theme consistent dark brown/ink
          trailColor: "#EAE0C8", // Theme consistent light paper/trail
          backgroundColor: "#FDF5E6", // Theme consistent card background
        })}
      />
    </div>
  );
};

export default HabitCircle;