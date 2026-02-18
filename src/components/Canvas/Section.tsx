import React, { useCallback } from 'react';
import type { Section as SectionType } from '../../types';
import { Column } from './Column';
import { useEditor } from '../../context/EditorContext';
import { setSectionMoveDragData } from '../../utils/dnd';
import styles from '../../styles/canvas.module.css';

interface SectionProps {
  section: SectionType;
}

export function Section({ section }: SectionProps) {
  const { state, dispatch } = useEditor();
  const isSelected = state.selection.sectionId === section.id && !state.selection.blockId;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({ type: 'SELECT_SECTION', payload: { sectionId: section.id } });
    },
    [dispatch, section.id],
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({ type: 'REMOVE_SECTION', payload: { sectionId: section.id } });
    },
    [dispatch, section.id],
  );

  const handleDuplicate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({ type: 'DUPLICATE_SECTION', payload: { sectionId: section.id } });
    },
    [dispatch, section.id],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      setSectionMoveDragData(e, section.id);
    },
    [section.id],
  );

  return (
    <div
      className={`${styles.section} ${isSelected ? styles.sectionSelected : ''} ${section.properties.fullWidth ? styles.sectionFullWidth : ''}`}
      style={{
        backgroundColor: section.properties.backgroundColor,
        padding: section.properties.padding,
        borderRadius: section.properties.borderRadius,
        backgroundImage: section.properties.backgroundImage ? `url(${section.properties.backgroundImage})` : undefined,
        backgroundSize: section.properties.backgroundSize || undefined,
        backgroundRepeat: section.properties.backgroundRepeat || undefined,
      }}
      onClick={handleClick}
      role="region"
      aria-label={`Email section${isSelected ? ' (selected)' : ''}`}
      aria-selected={isSelected}
    >
      <div className={styles.sectionOverlay} role="group" aria-label="Section actions">
        <span
          className={styles.sectionDragHandle}
          draggable
          onDragStart={handleDragStart}
          title="Drag to reorder"
          role="button"
          aria-label="Drag to reorder section"
          tabIndex={0}
        >
          ⠿
        </span>
        <button
          className={`${styles.sectionBtn} ${styles.sectionBtnDuplicate}`}
          onClick={handleDuplicate}
          title="Duplicate section"
          aria-label="Duplicate section"
        >
          ⧉
        </button>
        <button
          className={styles.sectionBtn}
          onClick={handleRemove}
          title="Remove section"
          aria-label="Remove section"
        >
          x
        </button>
      </div>
      <div className={styles.sectionContent}>
        {section.columns.map((column) => (
          <Column key={column.id} column={column} sectionId={section.id} />
        ))}
      </div>
    </div>
  );
}
