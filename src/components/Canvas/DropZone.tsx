import React, { useState, useCallback } from 'react';
import { isDropAllowed, getBlockTypeFromDrop, getBlockMoveFromDrop } from '../../utils/dnd';
import { useEditor } from '../../context/EditorContext';
import { generateBlockId } from '../../utils/id';
import { DEFAULT_BLOCK_PROPERTIES } from '../../constants';
import styles from '../../styles/canvas.module.css';

interface DropZoneProps {
  sectionId: string;
  columnId: string;
  index: number;
  /** Render as a full-size empty column placeholder */
  emptyPlaceholder?: boolean;
}

export function DropZone({ sectionId, columnId, index, emptyPlaceholder }: DropZoneProps) {
  const { dispatch } = useEditor();
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!isDropAllowed(e)) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      setIsOver(true);
    },
    [],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only trigger leave if we actually left this element
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
    setIsOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOver(false);

      // Check for new block from palette
      const blockType = getBlockTypeFromDrop(e);
      if (blockType) {
        const block = {
          id: generateBlockId(),
          type: blockType,
          properties: { ...DEFAULT_BLOCK_PROPERTIES[blockType] },
        };
        dispatch({
          type: 'ADD_BLOCK',
          payload: { sectionId, columnId, block, index },
        });
        dispatch({
          type: 'SELECT_BLOCK',
          payload: { sectionId, columnId, blockId: block.id },
        });
        return;
      }

      // Check for block move
      const moveData = getBlockMoveFromDrop(e);
      if (moveData) {
        dispatch({
          type: 'MOVE_BLOCK',
          payload: {
            fromSectionId: moveData.sectionId,
            fromColumnId: moveData.columnId,
            blockId: moveData.blockId,
            toSectionId: sectionId,
            toColumnId: columnId,
            toIndex: index,
          },
        });
      }
    },
    [dispatch, sectionId, columnId, index],
  );

  if (emptyPlaceholder) {
    return (
      <div
        className={`${styles.emptyColumn} ${isOver ? styles.emptyColumnActive : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isOver ? 'Release to drop' : 'Drag blocks here'}
      </div>
    );
  }

  return (
    <div
      className={`${styles.dropZone} ${isOver ? styles.dropZoneActive : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isOver && <div className={styles.dropZoneLabel}>Drop here</div>}
    </div>
  );
}
