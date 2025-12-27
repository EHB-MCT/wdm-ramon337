import React from 'react';
import { useDroppable } from '@dnd-kit/core';

/**
 * Droppable Component
 * Represents a valid drop zone (e.g., a specific time slot in the calendar).
 * It provides visual feedback (highlighting) when a draggable item hovers over it.
 */
export function Droppable({ id, children }) {
  const { isOver, setNodeRef } = useDroppable({ id });

  const style = {
    // Visual cue: Change background color when an item is hovered over this slot
    backgroundColor: isOver ? 'rgba(33, 150, 243, 0.15)' : undefined,
    
    // UX: Add a smooth transition effect instead of instant color change
    transition: 'background-color 0.2s ease',
    
    // Layout: Ensure it fills the grid cell
    height: '100%',
    width: '100%',
    
    // Safety: Ensure empty slots have minimal height so they remain valid drop targets
    minHeight: '100%', 
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
}