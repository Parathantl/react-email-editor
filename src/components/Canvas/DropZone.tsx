import React, { useState, useCallback, useRef } from 'react';
import { isDropAllowed, getBlockTypeFromDrop, getBlockMoveFromDrop, DND_TYPES } from '../../utils/dnd';
import { useEditorDispatch } from '../../context/EditorContext';
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

export const DropZone = React.memo(function DropZone({ sectionId, columnId, index, emptyPlaceholder }: DropZoneProps) {
  const dispatch = useEditorDispatch();
  const [isOver, setIsOver] = useState(false);
  const isOverRef = useRef(false);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!isDropAllowed(e)) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = e.dataTransfer.types.includes(DND_TYPES.BLOCK_ID) ? 'move' : 'copy';
      if (!isOverRef.current) {
        isOverRef.current = true;
        setIsOver(true);
      }
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
    isOverRef.current = false;
    setIsOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isOverRef.current = false;
      setIsOver(false);

      // Check for new block from palette
      const blockType = getBlockTypeFromDrop(e);
      if (blockType) {
        const block = {
          id: generateBlockId(),
          type: blockType,
          properties: JSON.parse(JSON.stringify(DEFAULT_BLOCK_PROPERTIES[blockType])),
        };
        dispatch({
          type: 'ADD_BLOCK_AND_SELECT',
          payload: { sectionId, columnId, block, index },
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
        className={`ee-drop-zone ee-drop-zone--empty ${styles.emptyColumn} ${isOver ? styles.emptyColumnActive : ''}`}
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
      className={`ee-drop-zone ${styles.dropZone} ${isOver ? styles.dropZoneActive : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isOver && <div className={styles.dropZoneLabel}>Drop here</div>}
    </div>
  );
});
