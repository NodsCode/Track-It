// src/App.tsx
import React, { useEffect } from 'react'; // useEffect no longer needed here for instance generation
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { HabitProvider } from './contexts/HabitContext'; // useHabits no longer needed here
import { GoalProvider } from './contexts/GoalContext';
import DashboardPage from './pages/DashboardPage';
import HabitsPage from './pages/HabitsPage';
import GoalsPage from './pages/GoalsPage';
import StatsPage from './pages/StatsPage';
import ArchivePage from './pages/ArchivePage';
import './styles/global.css';

const AppContent: React.FC = () => {
  // const { generateAndPruneInstances } = useHabits(); // No longer needed from here

  // useEffect(() => { // This logic is moved into HabitProvider's useEffect
  //   generateAndPruneInstances();
  // }, [generateAndPruneInstances]);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h1>Track-It!</h1>
        <nav>
          <ul>
            <li><NavLink to="/" end>Dashboard</NavLink></li>
            <li><NavLink to="/habits">Habits</NavLink></li>
            <li><NavLink to="/goals">Goals</NavLink></li>
            <li><NavLink to="/stats">Stats</NavLink></li>
            <li><NavLink to="/archive">Archive</NavLink></li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/archive" element={<ArchivePage />} />
        </Routes>
      </main>
    </div>
  );
}
// ... rest of App.tsx
function App() {
  return (
    <Router>
      <HabitProvider>
        <GoalProvider>
          <AppContent />
        </GoalProvider>
      </HabitProvider>
    </Router>
  );
}

export default App;