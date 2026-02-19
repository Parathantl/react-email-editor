import React, { useState, useCallback, useRef } from 'react';
import { isSectionDrop, getSectionMoveFromDrop } from '../../utils/dnd';
import { useEditorDispatch } from '../../context/EditorContext';
import styles from '../../styles/canvas.module.css';

interface SectionDropZoneProps {
  index: number;
}

export const SectionDropZone = React.memo(function SectionDropZone({ index }: SectionDropZoneProps) {
  const dispatch = useEditorDispatch();
  const [isOver, setIsOver] = useState(false);
  const isOverRef = useRef(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!isSectionDrop(e)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!isOverRef.current) {
      isOverRef.current = true;
      setIsOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      return;
    }
    isOverRef.current = false;
    setIsOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isOverRef.current = false;
      setIsOver(false);

      const sectionId = getSectionMoveFromDrop(e);
      if (!sectionId) return;

      dispatch({
        type: 'MOVE_SECTION',
        payload: { sectionId, toIndex: index },
      });
    },
    [dispatch, index],
  );

  return (
    <div
      className={`ee-section-drop-zone ${styles.sectionDropZone} ${isOver ? styles.sectionDropZoneActive : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isOver && <div className={styles.sectionDropZoneLabel}>Move section here</div>}
    </div>
  );
});
