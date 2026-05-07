import React, { useCallback, useEffect, useState } from 'react';
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
  customIcons?: Record<string, React.ReactNode>;
}

/** Read block ID and index from a block wrapper element's data attributes */
function getBlockData(e: React.SyntheticEvent): { blockId: string; index: number } | null {
  const el = (e.currentTarget as HTMLElement);
  const blockId = el.dataset.blockId;
  const index = el.dataset.blockIndex;
  if (!blockId || index === undefined) return null;
  return { blockId, index: Number(index) };
}

export const Column = React.memo(function Column({ column, sectionId, customIcons }: ColumnProps) {
  const selection = useSelectionContext();
  const dispatch = useEditorDispatch();
  const [blockToRemove, setBlockToRemove] = useState<string | null>(null);
  const blockDuplicateIcon = customIcons?.blockDuplicate ?? '📄';
  const blockRemoveIcon = customIcons?.blockRemove ?? '🗑️';
  const blockDragIcon = customIcons?.blockDrag ?? '↕️';

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

  // Single click handler — reads blockId from data attribute
  const handleBlockClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const data = getBlockData(e);
      if (!data) return;
      dispatch({
        type: 'SELECT_BLOCK',
        payload: { sectionId, columnId: column.id, blockId: data.blockId },
      });
    },
    [dispatch, sectionId, column.id],
  );

  // Action button handlers use event delegation — walk up to find block wrapper
  const handleRemoveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const wrapper = (e.currentTarget as HTMLElement).closest('[data-block-id]') as HTMLElement | null;
      if (wrapper?.dataset.blockId) confirmRemoveBlock(wrapper.dataset.blockId);
    },
    [confirmRemoveBlock],
  );

  const handleDuplicateClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const wrapper = (e.currentTarget as HTMLElement).closest('[data-block-id]') as HTMLElement | null;
      if (wrapper?.dataset.blockId) {
        dispatch({
          type: 'DUPLICATE_BLOCK',
          payload: { sectionId, columnId: column.id, blockId: wrapper.dataset.blockId },
        });
      }
    },
    [dispatch, sectionId, column.id],
  );

  const handleBlockDragStart = useCallback(
    (e: React.DragEvent) => {
      const wrapper = (e.currentTarget as HTMLElement).closest('[data-block-id]') as HTMLElement | null;
      const blockId = wrapper?.dataset.blockId;
      if (!blockId) return;
      setBlockMoveDragData(e, blockId, sectionId, column.id);
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        e.dataTransfer.setDragImage(wrapper, e.clientX - rect.left, e.clientY - rect.top);
      }
    },
    [sectionId, column.id],
  );

  const handleBlockDragKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      const wrapper = (e.currentTarget as HTMLElement).closest('[data-block-id]') as HTMLElement | null;
      const blockId = wrapper?.dataset.blockId;
      if (!blockId) return;
      const currentIndex = column.blocks.findIndex((b) => b.id === blockId);
      if (currentIndex === -1) return;
      const newIndex = e.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= column.blocks.length) return;
      e.preventDefault();
      e.stopPropagation();
      // MOVE_BLOCK auto-decrements toIndex when fromIdx < toIndex within the same column,
      // so for a downward swap we pass currentIndex + 2 to land at currentIndex + 1.
      const toIndex = e.key === 'ArrowUp' ? newIndex : currentIndex + 2;
      dispatch({
        type: 'MOVE_BLOCK',
        payload: {
          fromSectionId: sectionId,
          fromColumnId: column.id,
          blockId,
          toSectionId: sectionId,
          toColumnId: column.id,
          toIndex,
        },
      });
    },
    [dispatch, sectionId, column.id, column.blocks],
  );

  // Block-level drop detection: determines top/bottom half for precise insertion
  const [dropTarget, setDropTarget] = useState<{
    blockId: string;
    position: 'before' | 'after';
  } | null>(null);

  // Defensive cleanup: ensure the drop indicator never sticks if the drag
  // ends without a clean dragleave on this element (e.g., dropped on a
  // sibling, or released outside any valid target).
  useEffect(() => {
    const clear = () => setDropTarget(null);
    window.addEventListener('dragend', clear);
    window.addEventListener('drop', clear);
    return () => {
      window.removeEventListener('dragend', clear);
      window.removeEventListener('drop', clear);
    };
  }, []);

  const handleBlockDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!isDropAllowed(e)) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = e.dataTransfer.types.includes(DND_TYPES.BLOCK_ID)
        ? 'move'
        : 'copy';
      const data = getBlockData(e);
      if (!data) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position: 'before' | 'after' = e.clientY < midY ? 'before' : 'after';
      setDropTarget((prev) => {
        if (prev?.blockId === data.blockId && prev?.position === position) return prev;
        return { blockId: data.blockId, position };
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
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDropTarget(null);

      const data = getBlockData(e);
      if (!data) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const insertIndex = e.clientY < midY ? data.index : data.index + 1;

      const blockType = getBlockTypeFromDrop(e);
      if (blockType) {
        const newBlock = {
          id: generateBlockId(),
          type: blockType,
          properties: JSON.parse(JSON.stringify(DEFAULT_BLOCK_PROPERTIES[blockType])),
        };
        dispatch({
          type: 'ADD_BLOCK_AND_SELECT',
          payload: { sectionId, columnId: column.id, block: newBlock, index: insertIndex },
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

  const handleBlockKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      const data = getBlockData(e);
      if (!data) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        dispatch({
          type: 'SELECT_BLOCK',
          payload: { sectionId, columnId: column.id, blockId: data.blockId },
        });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        confirmRemoveBlock(data.blockId);
      }
    },
    [dispatch, sectionId, column.id, confirmRemoveBlock],
  );

  if (column.blocks.length === 0) {
    return (
      <div className={`ee-column ${styles['ee-column']}`} style={{ width: column.width }}>
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
    <div className={`ee-column ${styles['ee-column']}`} style={{ width: column.width }}>
      {column.blocks.map((block, index) => (
        <React.Fragment key={block.id}>
          <DropZone sectionId={sectionId} columnId={column.id} index={index} />
          <div
            data-block-type={block.type}
            data-block-id={block.id}
            data-block-index={index}
            className={[
              'ee-block',
              `ee-block--${block.type}`,
              selection.blockId === block.id && 'ee-block--selected',
              styles['ee-block-wrapper'],
              selection.blockId === block.id && styles['ee-block-selected'],
              dropTarget?.blockId === block.id &&
                dropTarget.position === 'before' &&
                styles['ee-block-drop-before'],
              dropTarget?.blockId === block.id &&
                dropTarget.position === 'after' &&
                styles['ee-block-drop-after'],
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={handleBlockClick}
            onDragOver={handleBlockDragOver}
            onDragLeave={handleBlockDragLeave}
            onDrop={handleBlockDrop}
            onKeyDown={handleBlockKeyDown}
            role="button"
            aria-label={`${block.type} block${selection.blockId === block.id ? ' (selected)' : ''}`}
            aria-selected={selection.blockId === block.id}
            tabIndex={0}
          >
            <div className={`ee-block-actions ${styles['ee-block-overlay']}`} role="group" aria-label="Block actions">
              <span className={`ee-block-type-label ${styles['ee-block-type-label']}`} aria-hidden="true">
                {block.type.charAt(0).toUpperCase() + block.type.slice(1)}
              </span>
              <span
                className={`ee-block-drag ${styles['ee-block-drag-handle']}`}
                draggable
                onDragStart={handleBlockDragStart}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleBlockDragKeyDown}
                title="Drag to reorder (or use Arrow Up/Down)"
                role="button"
                aria-label="Reorder block with Arrow Up/Down keys"
                tabIndex={0}
              >
                {blockDragIcon}
              </span>
              <button
                className={`ee-block-duplicate ${styles['ee-block-btn']} ${styles['ee-block-btn-duplicate']}`}
                onClick={handleDuplicateClick}
                title="Duplicate block"
                aria-label="Duplicate block"
              >
                {blockDuplicateIcon}
              </button>
              <button
                className={`ee-block-remove ${styles['ee-block-btn']}`}
                onClick={handleRemoveClick}
                title="Remove block"
                aria-label="Remove block"
              >
                {blockRemoveIcon}
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
