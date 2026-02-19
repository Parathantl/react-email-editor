import React, { useCallback, useState } from 'react';
import type { Column as ColumnType } from '../../types';
import { BlockRenderer } from './BlockRenderer';
import { DropZone } from './DropZone';
import { ConfirmDialog } from '../ConfirmDialog';
import { useSelectionContext, useEditorDispatch } from '../../context/EditorContext';
import {
  setBlockMoveDragData,
  isDropAllowed,
  getBlockTypeFromDrop,
  getBlockMoveFromDrop,
  DND_TYPES,
} from '../../utils/dnd';
import { generateBlockId } from '../../utils/id';
import { DEFAULT_BLOCK_PROPERTIES } from '../../constants';
import styles from '../../styles/canvas.module.css';

interface ColumnProps {
  column: ColumnType;
  sectionId: string;
}

export const Column = React.memo(function Column({ column, sectionId }: ColumnProps) {
  const selection = useSelectionContext();
  const dispatch = useEditorDispatch();
  const [blockToRemove, setBlockToRemove] = useState<string | null>(null);

  const confirmRemoveBlock = useCallback(
    (blockId: string) => {
      setBlockToRemove(blockId);
    },
    [],
  );

  const handleConfirmRemove = useCallback(() => {
    if (blockToRemove) {
      dispatch({
        type: 'REMOVE_BLOCK',
        payload: { sectionId, columnId: column.id, blockId: blockToRemove },
      });
      setBlockToRemove(null);
    }
  }, [dispatch, sectionId, column.id, blockToRemove]);

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
      confirmRemoveBlock(blockId);
    },
    [confirmRemoveBlock],
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

  // Block-level drop detection: determines top/bottom half for precise insertion
  const [dropTarget, setDropTarget] = useState<{
    blockId: string;
    position: 'before' | 'after';
  } | null>(null);

  const handleBlockDragOver = useCallback(
    (e: React.DragEvent, blockId: string) => {
      if (!isDropAllowed(e)) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = e.dataTransfer.types.includes(DND_TYPES.BLOCK_ID)
        ? 'move'
        : 'copy';
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position: 'before' | 'after' = e.clientY < midY ? 'before' : 'after';
      setDropTarget((prev) => {
        if (prev?.blockId === blockId && prev?.position === position) return prev;
        return { blockId, position };
      });
    },
    [],
  );

  const handleBlockDragLeave = useCallback((e: React.DragEvent) => {
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
    setDropTarget(null);
  }, []);

  const handleBlockDrop = useCallback(
    (e: React.DragEvent, blockIndex: number) => {
      e.preventDefault();
      e.stopPropagation();
      setDropTarget(null);

      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const insertIndex = e.clientY < midY ? blockIndex : blockIndex + 1;

      const blockType = getBlockTypeFromDrop(e);
      if (blockType) {
        const newBlock = {
          id: generateBlockId(),
          type: blockType,
          properties: { ...DEFAULT_BLOCK_PROPERTIES[blockType] },
        };
        dispatch({
          type: 'ADD_BLOCK',
          payload: { sectionId, columnId: column.id, block: newBlock, index: insertIndex },
        });
        dispatch({
          type: 'SELECT_BLOCK',
          payload: { sectionId, columnId: column.id, blockId: newBlock.id },
        });
        return;
      }

      const moveData = getBlockMoveFromDrop(e);
      if (moveData) {
        dispatch({
          type: 'MOVE_BLOCK',
          payload: {
            fromSectionId: moveData.sectionId,
            fromColumnId: moveData.columnId,
            blockId: moveData.blockId,
            toSectionId: sectionId,
            toColumnId: column.id,
            toIndex: insertIndex,
          },
        });
      }
    },
    [dispatch, sectionId, column.id],
  );

  if (column.blocks.length === 0) {
    return (
      <div className={`ee-column ${styles.column}`} style={{ width: column.width }}>
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
    <div className={`ee-column ${styles.column}`} style={{ width: column.width }}>
      {column.blocks.map((block, index) => (
        <React.Fragment key={block.id}>
          <DropZone sectionId={sectionId} columnId={column.id} index={index} />
          <div
            data-block-type={block.type}
            className={[
              'ee-block',
              `ee-block--${block.type}`,
              selection.blockId === block.id && 'ee-block--selected',
              styles.blockWrapper,
              selection.blockId === block.id && styles.blockSelected,
              dropTarget?.blockId === block.id &&
                dropTarget.position === 'before' &&
                styles.blockDropBefore,
              dropTarget?.blockId === block.id &&
                dropTarget.position === 'after' &&
                styles.blockDropAfter,
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={(e) => handleBlockClick(block.id, e)}
            draggable
            onDragStart={(e) => handleBlockDragStart(block.id, e)}
            onDragOver={(e) => handleBlockDragOver(e, block.id)}
            onDragLeave={handleBlockDragLeave}
            onDrop={(e) => handleBlockDrop(e, index)}
            role="button"
            aria-label={`${block.type} block${selection.blockId === block.id ? ' (selected)' : ''}`}
            aria-selected={selection.blockId === block.id}
            tabIndex={0}
            onKeyDown={(e) => {
              const target = e.target as HTMLElement;
              if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
              }
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
                confirmRemoveBlock(block.id);
              }
            }}
          >
            <div className={`ee-block-actions ${styles.blockOverlay}`} role="group" aria-label="Block actions">
              <button
                className={`ee-block-duplicate ${styles.blockBtn} ${styles.blockBtnDuplicate}`}
                onClick={(e) => handleDuplicateBlock(block.id, e)}
                title="Duplicate block"
                aria-label="Duplicate block"
              >
                ⧉
              </button>
              <button
                className={`ee-block-remove ${styles.blockBtn}`}
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
      {blockToRemove && (
        <ConfirmDialog
          title="Remove Block"
          message="Are you sure you want to remove this block? This action can be undone with Ctrl+Z."
          onConfirm={handleConfirmRemove}
          onCancel={() => setBlockToRemove(null)}
        />
      )}
    </div>
  );
});
