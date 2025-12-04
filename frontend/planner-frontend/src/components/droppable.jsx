import React from 'react';
import { useDroppable } from '@dnd-kit/core';

export function Droppable({ id, children }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id, // Dit wordt bijvoorbeeld 'Monday'
  });

  const style = {
    backgroundColor: isOver ? '#e3f2fd' : undefined, // Visuele feedback als je erover zweeft
    transition: 'background-color 0.2s',
    height: '100%', // Zorg dat de hele kolom een dropzone is
    minHeight: '400px'
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
}