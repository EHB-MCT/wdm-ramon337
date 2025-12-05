import React from 'react';
import WeekPlanner from '../components/WeekPlanner';

function DashboardPage() {
  return (
    <div style={{ padding: '0px 20px' }}>
      <h1>Weekly Dashboard</h1>
      <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />
      <WeekPlanner />
    </div>
  );
}

export default DashboardPage;