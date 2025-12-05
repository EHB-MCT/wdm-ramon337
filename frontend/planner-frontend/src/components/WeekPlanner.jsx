import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { fetchUserProfile } from '../api/auth';
import { logEvent } from '../api/logging';
import { Draggable } from './draggable';
import { Droppable } from './droppable';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ROW_HEIGHT = 60;

const checkOverlap = (targetDay, targetHour, itemDuration, currentItemId, placements, allItems) => {
  for (const [placedItemId, placedSlotId] of Object.entries(placements)) {
    if (placedItemId === currentItemId) continue; 

    const [placedDay, placedHourStr] = placedSlotId.split('-');
    const placedHour = parseFloat(placedHourStr);
    
    if (placedDay !== targetDay) continue;

    const placedItem = allItems.find(i => i.id === placedItemId);
    const placedDuration = placedItem ? placedItem.duration : 1;

    if (targetHour < (placedHour + placedDuration) && placedHour < (targetHour + itemDuration)) {
      return true;
    }
  }
  return false;
};

function WeekPlanner() {
  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState([]);
  const [placements, setPlacements] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('userToken');
      try {
        const data = await fetchUserProfile(token);
        const prefs = data.initialPreferences;
        let generatedItems = [];

        if (prefs.hobbies) {
            prefs.hobbies.forEach((hobby, index) => {
                const freq = Number(hobby.frequency) || 1; 
                const dur = Number(hobby.duration) || 1; 

                for (let i = 0; i < freq; i++) {
                    generatedItems.push({
                        id: `hobby-${index}-${i}`,
                        name: hobby.name,
                        duration: dur,
                        type: 'HOBBY',
                        color: '#e3f2fd',
                        borderColor: '#2196f3'
                    });
                }
            });
        }

        let hoursLeft = prefs.workHours || 40;
        let workIndex = 0;
        while (hoursLeft > 0) {
            const blockDuration = hoursLeft >= 4 ? 4 : hoursLeft;
            generatedItems.push({
                id: `work-${workIndex}`,
                name: 'Work',
                duration: blockDuration,
                type: 'WORK',
                color: '#ffecd1',
                borderColor: 'orange'
            });
            hoursLeft -= blockDuration;
            workIndex++;
        }
        setAllItems(generatedItems);
      } catch (err) {
        console.error("Error loading planner:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    setError(null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const itemId = active.id;
    const targetId = over.id;
    const item = allItems.find(i => i.id === itemId);

    if (targetId === 'inbox') {
        const newPlacements = { ...placements };
        delete newPlacements[itemId];
        setPlacements(newPlacements);
        logEvent('TASK_MOVED', { itemId, target: 'inbox' });
        return;
    }

    const [targetDay, targetHourStr] = targetId.split('-');
    const targetHour = parseInt(targetHourStr);

    const hasOverlap = checkOverlap(targetDay, targetHour, item.duration, itemId, placements, allItems);

    if (hasOverlap) {

        return; 
    }

    setPlacements(prev => ({
        ...prev,
        [itemId]: targetId
    }));
    
    logEvent('TASK_SCHEDULED', { itemId, day: targetDay, hour: targetHour });
  };

  const inboxItems = allItems.filter(item => !placements[item.id]);

  const getItemStartingAt = (slotId) => {
      const itemId = Object.keys(placements).find(key => placements[key] === slotId);
      if (!itemId) return null;
      return allItems.find(i => i.id === itemId);
  };

  const isSlotOccupied = (day, hour) => {

      for (const [placedItemId, placedSlotId] of Object.entries(placements)) {
          const [pDay, pHourStr] = placedSlotId.split('-');
          const pHour = parseInt(pHourStr);
          
          if (pDay === day) {
              const item = allItems.find(i => i.id === placedItemId);

              if (hour > pHour && hour < (pHour + item.duration)) {
                  return true;
              }
          }
      }
      return false;
  };

  if (loading) return <div className="page-container">Loading...</div>;

  const ItemComponent = ({ item, isOverlay }) => {

    const height = isOverlay 
        ? `${item.duration * ROW_HEIGHT - 4}px` 
        : (item.duration > 1 ? `${item.duration * ROW_HEIGHT - 2}px` : '100%'); 

    return (
        <div style={{
            background: item.color, 
            borderLeft: `4px solid ${item.borderColor}`,
            padding: '5px', 
            borderRadius: '4px', 
            fontSize: '0.8rem',
            height: height,
            boxSizing: 'border-box',
            zIndex: 20
        }}>
            <strong>{item.name}</strong>
            <div>{item.duration}h</div>
        </div>
    );
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="planner-wrapper" style={{ display: 'flex', gap: '20px', height: '85vh', flexDirection: 'column' }}>
        
        {error && <div style={{background: '#ffebee', color: '#c62828', padding: '10px', textAlign:'center'}}>{error}</div>}

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* --- ROOSTER --- */}
            <div className="planner-main" style={{ flex: 4, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <div className="schedule-header">
                    <div className="header-cell">Time</div>
                    {DAYS.map(day => <div key={day} className="header-cell">{day}</div>)}
                </div>

                <div className="schedule-grid">
                    {HOURS.map(hour => (
                        <React.Fragment key={hour}>
                            <div className="time-label">{hour}:00</div>

                            {DAYS.map(day => {
                                const slotId = `${day}-${hour}`;
                                const itemStarting = getItemStartingAt(slotId);
                                const isOccupiedByLongTask = isSlotOccupied(day, hour);

                                return (
                                    <Droppable key={slotId} id={slotId}>
                                        <div className="time-slot" style={{ 
                       
                                        }}>
                                            {itemStarting && (
                                                <Draggable id={itemStarting.id} data={itemStarting}>
                                                    <div className="scheduled-task" style={{
                      
                                                        height: `${itemStarting.duration * ROW_HEIGHT - 2}px`,
                                                        background: itemStarting.color,
                                                        borderLeft: `4px solid ${itemStarting.borderColor}`,
                                                    }}>
                                                        <strong>{itemStarting.name}</strong> ({itemStarting.duration}h)
                                                    </div>
                                                </Draggable>
                                            )}
                                        </div>
                                    </Droppable>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
            <div className="planner-sidebar" style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '20px' }}>
                <Droppable id="inbox"> 
                    <div style={{ background: 'white', padding: '15px', height: '100%', overflowY: 'auto', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <h3>Inbox</h3>
                        <hr/>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {inboxItems.map(item => (
                                <Draggable key={item.id} id={item.id} data={item}>
                                    <div className="draggable-item" style={{ 
                                        background: item.color, 
                                        borderLeft: `4px solid ${item.borderColor}`,
                                        padding: '10px', borderRadius: '4px'
                                    }}>
                                        <strong>{item.name}</strong> ({item.duration}h)
                                    </div>
                                </Draggable>
                            ))}
                        </div>
                    </div>
                </Droppable>
            </div>
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
            <div style={{ width: '140px', opacity: 0.8 }}>
               <ItemComponent item={allItems.find(i => i.id === activeId)} isOverlay={true} />
            </div>
        ) : null}
      </DragOverlay>

    </DndContext>
  );
}

export default WeekPlanner;