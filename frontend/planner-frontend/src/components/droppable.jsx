import React from 'react';
import { useDroppable } from '@dnd-kit/core';

export function Droppable({ id, children }) {
  const { isOver, setNodeRef } = useDroppable({ id });

  const style = {
    backgroundColor: isOver ? 'rgba(33, 150, 243, 0.1)' : undefined,
    height: '100%',
    width: '100%'
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
}