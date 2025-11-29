import React from 'react';

function WeekPlanner() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="planner-grid">
      {days.map(day => (
        <div key={day} className="day-column">
          <div className="day-header">{day}</div>
          <div className="day-content">
            <div className="task-placeholder">
              + Add Task
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default WeekPlanner;