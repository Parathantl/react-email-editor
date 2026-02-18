import React, { useCallback } from 'react';
import type { Column as ColumnType } from '../../types';
import { BlockRenderer } from './BlockRenderer';
import { DropZone } from './DropZone';
import { useEditor } from '../../context/EditorContext';
import { setBlockMoveDragData } from '../../utils/dnd';
import styles from '../../styles/canvas.module.css';

interface ColumnProps {
  column: ColumnType;
  sectionId: string;
}

export function Column({ column, sectionId }: ColumnProps) {
  const { state, dispatch } = useEditor();
  const { selection } = state;

  const handleBlockClick = useCallback(
    (blockId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({
        type: 'SELECT_BLOCK',
        payload: { sectionId, columnId: column.id, blockId },
      });
    },
    [dispatch, sectionId, column.id],
  );

  const handleRemoveBlock = useCallback(
    (blockId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({
        type: 'REMOVE_BLOCK',
        payload: { sectionId, columnId: column.id, blockId },
      });
    },
    [dispatch, sectionId, column.id],
  );

  const handleDuplicateBlock = useCallback(
    (blockId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({
        type: 'DUPLICATE_BLOCK',
        payload: { sectionId, columnId: column.id, blockId },
      });
    },
    [dispatch, sectionId, column.id],
  );

  const handleBlockDragStart = useCallback(
    (blockId: string, e: React.DragEvent) => {
      setBlockMoveDragData(e, blockId, sectionId, column.id);
    },
    [sectionId, column.id],
  );

  if (column.blocks.length === 0) {
    return (
      <div className={styles.column} style={{ width: column.width }}>
        <DropZone
          sectionId={sectionId}
          columnId={column.id}
          index={0}
          emptyPlaceholder
        />
      </div>
    );
  }

  return (
    <div className={styles.column} style={{ width: column.width }}>
      {column.blocks.map((block, index) => (
        <React.Fragment key={block.id}>
          <DropZone sectionId={sectionId} columnId={column.id} index={index} />
          <div
            className={`${styles.blockWrapper} ${
              selection.blockId === block.id ? styles.blockSelected : ''
            }`}
            onClick={(e) => handleBlockClick(block.id, e)}
            draggable
            onDragStart={(e) => handleBlockDragStart(block.id, e)}
            role="button"
            aria-label={`${block.type} block${selection.blockId === block.id ? ' (selected)' : ''}`}
            aria-selected={selection.blockId === block.id}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                dispatch({
                  type: 'SELECT_BLOCK',
                  payload: { sectionId, columnId: column.id, blockId: block.id },
                });
              } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                e.stopPropagation();
                dispatch({
                  type: 'REMOVE_BLOCK',
                  payload: { sectionId, columnId: column.id, blockId: block.id },
                });
              }
            }}
          >
            <div className={styles.blockOverlay} role="group" aria-label="Block actions">
              <button
                className={`${styles.blockBtn} ${styles.blockBtnDuplicate}`}
                onClick={(e) => handleDuplicateBlock(block.id, e)}
                title="Duplicate block"
                aria-label="Duplicate block"
              >
                ⧉
              </button>
              <button
                className={styles.blockBtn}
                onClick={(e) => handleRemoveBlock(block.id, e)}
                title="Remove block"
                aria-label="Remove block"
              >
                x
              </button>
            </div>
            <BlockRenderer block={block} />
          </div>
        </React.Fragment>
      ))}
      <DropZone
        sectionId={sectionId}
        columnId={column.id}
        index={column.blocks.length}
      />
    </div>
  );
}
