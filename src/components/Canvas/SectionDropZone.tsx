import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clearIfNotOver = (e: DragEvent) => {
      if (!isOverRef.current) return;
      const el = elRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!inside) {
        isOverRef.current = false;
        setIsOver(false);
      }
    };
    const clear = () => {
      if (isOverRef.current) {
        isOverRef.current = false;
        setIsOver(false);
      }
    };
    window.addEventListener('dragover', clearIfNotOver);
    window.addEventListener('dragend', clear);
    window.addEventListener('drop', clear);
    return () => {
      window.removeEventListener('dragover', clearIfNotOver);
      window.removeEventListener('dragend', clear);
      window.removeEventListener('drop', clear);
    };
  }, []);

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
      ref={elRef}
      className={`ee-section-drop-zone ${styles['ee-section-drop-zone']} ${isOver ? styles['ee-section-drop-zone-active'] : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isOver && <div className={styles['ee-section-drop-zone-label']}>Move section here</div>}
    </div>
  );
});
