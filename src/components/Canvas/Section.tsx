import React, { useCallback, useState } from 'react';
import type { Section as SectionType } from '../../types';
import { Column } from './Column';
import { ConfirmDialog } from '../ConfirmDialog';
import { useSelectionContext, useEditorDispatch, useTemplateContext } from '../../context/EditorContext';
import { setSectionMoveDragData } from '../../utils/dnd';
import styles from '../../styles/canvas.module.css';

interface SectionProps {
  section: SectionType;
}

export const Section = React.memo(function Section({ section }: SectionProps) {
  const selection = useSelectionContext();
  const dispatch = useEditorDispatch();
  const { template } = useTemplateContext();
  const isSelected = selection.sectionId === section.id && !selection.blockId;
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

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
      setShowRemoveConfirm(true);
    },
    [],
  );

  const handleConfirmRemove = useCallback(() => {
    dispatch({ type: 'REMOVE_SECTION', payload: { sectionId: section.id } });
    setShowRemoveConfirm(false);
  }, [dispatch, section.id]);

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

  const handleDragKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      e.stopPropagation();
      const sections = template.sections;
      const currentIndex = sections.findIndex((s) => s.id === section.id);
      if (currentIndex === -1) return;
      const toIndex = e.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1;
      if (toIndex < 0 || toIndex >= sections.length) return;
      dispatch({ type: 'MOVE_SECTION', payload: { sectionId: section.id, toIndex } });
    },
    [dispatch, section.id, template.sections],
  );

  return (
    <div
      className={`ee-section ${isSelected ? 'ee-section--selected' : ''} ${section.properties.fullWidth ? 'ee-section--full-width' : ''} ${styles.section} ${isSelected ? styles.sectionSelected : ''} ${section.properties.fullWidth ? styles.sectionFullWidth : ''}`}
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
      <div className={`ee-section-actions ${styles.sectionOverlay}`} role="group" aria-label="Section actions">
        <span
          className={`ee-section-drag ${styles.sectionDragHandle}`}
          draggable
          onDragStart={handleDragStart}
          onKeyDown={handleDragKeyDown}
          title="Drag to reorder (or use Arrow keys)"
          role="button"
          aria-label="Reorder section with Arrow Up/Down keys"
          tabIndex={0}
        >
          ⠿
        </span>
        <button
          className={`ee-section-duplicate ${styles.sectionBtn} ${styles.sectionBtnDuplicate}`}
          onClick={handleDuplicate}
          title="Duplicate section"
          aria-label="Duplicate section"
        >
          ⧉
        </button>
        <button
          className={`ee-section-remove ${styles.sectionBtn}`}
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
      {showRemoveConfirm && (
        <ConfirmDialog
          title="Remove Section"
          message="Are you sure you want to remove this section and all its contents? This action can be undone with Ctrl+Z."
          onConfirm={handleConfirmRemove}
          onCancel={() => setShowRemoveConfirm(false)}
        />
      )}
    </div>
  );
});
