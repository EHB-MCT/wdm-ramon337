import React from 'react';
import { useDraggable } from '@dnd-kit/core';

/**
 * Draggable Component (DnD-Kit Wrapper)
 * Wraps any content (like a Task card) to make it interactive.
 * It handles the coordinate transformations during the drag operation.
 */
export function Draggable({ id, data, children }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    data: data,
  });

  // Apply styles dynamically based on drag state
  const style = {
    // Use translate3d for GPU acceleration (smoother performance)
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    
    // Visual feedback
    zIndex: isDragging ? 9999 : "auto", // Ensure dragged item floats above everything
    cursor: isDragging ? 'grabbing' : 'grab', // UI cue for the user
    opacity: isDragging ? 0.8 : 1, // Slight transparency effect while dragging
    
    // Prevent scrolling on touch devices while dragging
    touchAction: 'none', 
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}