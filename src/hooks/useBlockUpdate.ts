import { useCallback } from 'react';
import type { BlockProperties } from '../types';
import { useEditorDispatch } from '../context/EditorContext';

/**
 * Hook that returns a memoized `update` function for dispatching UPDATE_BLOCK.
 * Eliminates the repeated useCallback + dispatch boilerplate in every property panel.
 *
 * Accepts `Record<string, unknown>` to avoid `as any` casts when PropertyField
 * onChange returns a plain string for select/alignment values.
 */
export function useBlockUpdate(blockId: string) {
  const dispatch = useEditorDispatch();

  const update = useCallback(
    (properties: Partial<BlockProperties> | Record<string, unknown>) => {
      dispatch({
        type: 'UPDATE_BLOCK',
        payload: { blockId, properties: properties as Partial<BlockProperties> },
      });
    },
    [dispatch, blockId],
  );

  return update;
}
