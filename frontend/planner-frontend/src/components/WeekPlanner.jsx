import React from 'react';

function WeekPlanner() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="planner-grid">
      {days.map(day => (
        <div key={day} style={{ 
          minWidth: '150px', 
          flex: 1, 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '10px',
          background: '#fff' 
        }}>
          <h3 style={{ textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>{day}</h3>
          <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '4px', border: '1px dashed #ccc', textAlign: 'center', color: '#888' }}>
              + Add Task
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default WeekPlanner;