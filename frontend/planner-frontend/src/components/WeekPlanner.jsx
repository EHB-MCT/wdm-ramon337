import React, { useState, useEffect } from 'react';
import { DndContext } from '@dnd-kit/core';
import { fetchUserProfile } from '../api/auth';
import { logEvent } from '../api/logging';
import { Draggable } from './Draggable';
import { Droppable } from './Droppable';

function WeekPlanner() {
  const [loading, setLoading] = useState(true);
  
  // STATE: Tracks items in the 'inbox' and items scheduled on specific days
  const [inbox, setInbox] = useState([]);
  const [schedule, setSchedule] = useState({
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
  });

  const days = Object.keys(schedule);

  // 1. Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('userToken');
      try {
        const data = await fetchUserProfile(token);
        
        // Transform hobbies into draggable items with unique IDs
        const hobbiesWithIds = data.initialPreferences.hobbies.map((h, i) => ({
            ...h,
            id: `hobby-${i}-${Date.now()}`, // Generate unique ID
            type: 'HOBBY'
        }));

        setInbox(hobbiesWithIds);
        
        // Add a generic work block as well
        setInbox(prev => [
            ...prev, 
            { id: 'work-block', name: 'Work Block', duration: 4, type: 'WORK' }
        ]);

      } catch (err) {
        console.error("Error loading planner:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. Handle the Drag End event
  const handleDragEnd = (event) => {
    const { active, over } = event;

    // If dropped over nothing, do nothing
    if (!over) return;

    const itemId = active.id;
    const dayDropped = over.id; // 'Monday', 'Tuesday', etc.
    const itemData = active.data.current; // The data we attached

    // LOGGING: THE WEAPON! 🔫
    // Log that the user made a planning decision
    logEvent('TASK_DROPPED', {
        itemId: itemId,
        targetDay: dayDropped,
        itemType: itemData?.type
    });

    // LOGIC: Move from Inbox to Schedule
    // Check if the item came from the inbox
    const itemInInbox = inbox.find(i => i.id === itemId);

    if (itemInInbox) {
        // 1. Remove from inbox
        setInbox(inbox.filter(i => i.id !== itemId));
        // 2. Add to the target day
        setSchedule(prev => ({
            ...prev,
            [dayDropped]: [...prev[dayDropped], itemInInbox]
        }));
    } else {
        // (Optional: Future logic to move tasks between days)
    }
  };

  if (loading) return <div className="page-container">Loading planner...</div>;

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="planner-wrapper" style={{ display: 'flex', gap: '20px', minHeight: '80vh' }}>
        
        {/* --- COLUMN 1: THE WEEK GRID --- */}
        <div className="planner-main" style={{ flex: 3, overflowX: 'auto' }}>
          <div className="planner-grid">
            {days.map(day => (
              <div key={day} className="day-column">
                <div className="day-header">{day}</div>
                <div className="day-content">
                  
                  {/* Make the entire day content area droppable */}
                  <Droppable id={day}>
                    
                    {/* Render tasks already scheduled on this day */}
                    {schedule[day].map((task) => (
                        <div key={task.id} className="task-card">
                            <strong>{task.name}</strong>
                            <div style={{fontSize: '0.8em'}}>{task.duration}h</div>
                        </div>
                    ))}
                    
                    {/* Placeholder text if empty */}
                    {schedule[day].length === 0 && (
                        <div style={{padding: '20px', color: '#ccc', textAlign: 'center', fontSize: '0.9rem'}}>
                            Drop here
                        </div>
                    )}
                  </Droppable>

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- COLUMN 2: THE INBOX (Source) --- */}
        <div className="planner-sidebar" style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h3>To Plan</h3>
          <p style={{ fontSize: '0.8rem', color: '#666' }}>Drag these items into your week.</p>
          <hr style={{margin: '10px 0'}}/>

          {inbox.map((item) => (
            <Draggable key={item.id} id={item.id} data={item}>
                <div className="draggable-item" style={{ 
                    background: item.type === 'WORK' ? '#ffecd1' : '#e3f2fd', 
                    padding: '10px', 
                    marginBottom: '10px', 
                    borderRadius: '4px', 
                    borderLeft: item.type === 'WORK' ? '4px solid orange' : '4px solid #2196f3',
                    cursor: 'grab'
                }}>
                    <strong>{item.name}</strong>
                    <div style={{ fontSize: '0.8rem' }}>{item.duration}h</div>
                </div>
            </Draggable>
          ))}
          
          {inbox.length === 0 && <p style={{color:'green', marginTop: '20px'}}>All planned! 🎉</p>}
        </div>

      </div>
    </DndContext>
  );
}

export default WeekPlanner;