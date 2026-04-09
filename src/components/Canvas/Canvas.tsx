import React, { useCallback, useState } from 'react';
import { Section } from './Section';
import { SectionDropZone } from './SectionDropZone';
import { useTemplateContext, useEditorDispatch, useHistoryContext } from '../../context/EditorContext';
import { createSection, createSectionWithBlock } from '../../utils/factory';
import { isDropAllowed, getBlockTypeFromDrop } from '../../utils/dnd';
import styles from '../../styles/canvas.module.css';

type CanvasPreviewMode = 'desktop' | 'mobile';
type CanvasCustomIcons = Record<string, React.ReactNode>;
interface CanvasProps {
  customIcons?: CanvasCustomIcons;
}

const MOBILE_WIDTH = 375;

export const Canvas = React.memo(function Canvas({ customIcons }: CanvasProps) {
  const { template } = useTemplateContext();
  const { canUndo, canRedo } = useHistoryContext();
  const dispatch = useEditorDispatch();
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewMode, setPreviewMode] = useState<CanvasPreviewMode>('desktop');

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

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, [dispatch]);

  const canvasWidth = previewMode === 'mobile' ? MOBILE_WIDTH : template.globalStyles.width;
  const desktopIcon = customIcons?.desktop ?? '🖥';
  const mobileIcon = customIcons?.mobile ?? '📱';
  const undoIcon = customIcons?.undo ?? '↩';
  const redoIcon = customIcons?.redo ?? '↪';

  return (
    <div className={`ee-canvas-area ${styles['ee-canvas-area']}`}>
      <div className={`ee-canvas-header ${styles['ee-canvas-header']}`}>
        <div className={`ee-canvas-header-center ${styles['ee-canvas-header-center']}`}>
          <div className={`ee-canvas-view-toggle ${styles['ee-canvas-header-group']}`} role="group" aria-label="Preview size">
            <button
              className={`ee-canvas-view-desktop ${styles['ee-canvas-header-btn']} ${previewMode === 'desktop' ? `ee-canvas-view--active ${styles['ee-canvas-header-btn-active']}` : ''}`}
              onClick={() => setPreviewMode('desktop')}
              aria-pressed={previewMode === 'desktop'}
              aria-label="Desktop view"
              title={`Desktop (${template.globalStyles.width}px)`}
            >
              {desktopIcon}
            </button>
            <button
              className={`ee-canvas-view-mobile ${styles['ee-canvas-header-btn']} ${previewMode === 'mobile' ? `ee-canvas-view--active ${styles['ee-canvas-header-btn-active']}` : ''}`}
              onClick={() => setPreviewMode('mobile')}
              aria-pressed={previewMode === 'mobile'}
              aria-label="Mobile view"
              title="Mobile (375px)"
            >
              {mobileIcon}
            </button>
          </div>
        </div>
        <div className={`ee-canvas-history ${styles['ee-canvas-header-group']}`} role="group" aria-label="History">
          <button
            className={`ee-canvas-undo ${styles['ee-canvas-header-btn']}`}
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            {undoIcon}
          </button>
          <button
            className={`ee-canvas-redo ${styles['ee-canvas-header-btn']}`}
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            {redoIcon}
          </button>
        </div>
      </div>
      <div className={`ee-canvas-wrapper ${styles['ee-canvas-wrapper']}`} onClick={handleCanvasClick} role="main" aria-label="Email canvas">
        <div
          className={`ee-canvas-body ${styles['ee-canvas-body']} ${isDragOver ? styles['ee-canvas-body-drag-over'] : ''}`}
          style={{
            width: canvasWidth,
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
              <Section section={section} customIcons={customIcons} />
            </React.Fragment>
          ))}
          {template.sections.length > 0 && (
            <SectionDropZone index={template.sections.length} />
          )}
          <button className={`ee-add-section ${styles['ee-add-section-btn']}`} onClick={handleAddSection} aria-label="Add new section">
            {(customIcons?.addSection ?? '➕')} Add Section
          </button>
        </div>
      </div>
    </div>
  );
});
