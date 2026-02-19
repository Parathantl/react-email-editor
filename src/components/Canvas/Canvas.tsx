import React, { useCallback, useState } from 'react';
import { Section } from './Section';
import { SectionDropZone } from './SectionDropZone';
import { useTemplateContext, useEditorDispatch } from '../../context/EditorContext';
import { createSection, createSectionWithBlock } from '../../utils/factory';
import { isDropAllowed, getBlockTypeFromDrop } from '../../utils/dnd';
import styles from '../../styles/canvas.module.css';

export const Canvas = React.memo(function Canvas() {
  const { template } = useTemplateContext();
  const dispatch = useEditorDispatch();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleAddSection = useCallback(() => {
    dispatch({ type: 'ADD_SECTION', payload: { section: createSection() } });
  }, [dispatch]);

  const handleCanvasClick = useCallback(() => {
    dispatch({ type: 'DESELECT_ALL' });
  }, [dispatch]);

  const handleBodyDragOver = useCallback((e: React.DragEvent) => {
    if (!isDropAllowed(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleBodyDragLeave = useCallback((e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
      return;
    }
    setIsDragOver(false);
  }, []);

  const handleBodyDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const blockType = getBlockTypeFromDrop(e);
      if (!blockType) return;

      const section = createSectionWithBlock(blockType);
      const column = section.columns[0];
      const block = column.blocks[0];

      dispatch({ type: 'ADD_SECTION', payload: { section } });
      dispatch({
        type: 'SELECT_BLOCK',
        payload: { sectionId: section.id, columnId: column.id, blockId: block.id },
      });
      // Note: ADD_SECTION must happen first so the section exists before selection.
      // These are both cheap (SELECT_BLOCK is UI-only, no history push).
    },
    [dispatch],
  );

  return (
    <div className={`ee-canvas-wrapper ${styles.canvasWrapper}`} onClick={handleCanvasClick} role="main" aria-label="Email canvas">
      <div
        className={`ee-canvas-body ${styles.canvasBody} ${isDragOver ? styles.canvasBodyDragOver : ''}`}
        style={{
          width: template.globalStyles.width,
          backgroundColor: template.globalStyles.backgroundColor,
          fontFamily: template.globalStyles.fontFamily,
        }}
        onClick={(e) => e.stopPropagation()}
        onDragOver={handleBodyDragOver}
        onDragLeave={handleBodyDragLeave}
        onDrop={handleBodyDrop}
        aria-label="Email content area"
      >
        {template.sections.map((section, index) => (
          <React.Fragment key={section.id}>
            <SectionDropZone index={index} />
            <Section section={section} />
          </React.Fragment>
        ))}
        {template.sections.length > 0 && (
          <SectionDropZone index={template.sections.length} />
        )}
        <button className={`ee-add-section ${styles.addSectionBtn}`} onClick={handleAddSection} aria-label="Add new section">
          + Add Section
        </button>
      </div>
    </div>
  );
});
