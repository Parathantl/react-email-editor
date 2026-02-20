import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Variable, VariableChipStyle } from '../types';
import { DEFAULT_VARIABLE_CHIP_STYLE } from '../constants';

interface UseVariablesOptions {
  predefinedVariables: Variable[];
  initialCustomVariables?: Variable[];
  onVariablesChange?: (customVariables: Variable[]) => void;
}

interface UseVariablesResult {
  customVariables: Variable[];
  allVariables: Variable[];
  variableChipStyle: VariableChipStyle;
  addCustomVariable: (variable: Variable) => void;
  removeCustomVariable: (key: string) => void;
  updateVariableChipStyle: (style: Partial<VariableChipStyle>) => void;
}

export function useVariables({
  predefinedVariables,
  initialCustomVariables,
  onVariablesChange,
}: UseVariablesOptions): UseVariablesResult {
  const [customVariables, setCustomVariables] = useState<Variable[]>(initialCustomVariables ?? []);
  const [variableChipStyle, setVariableChipStyle] = useState<VariableChipStyle>({ ...DEFAULT_VARIABLE_CHIP_STYLE });

  const addCustomVariable = useCallback((variable: Variable) => {
    setCustomVariables((prev) => {
      if (prev.some((v) => v.key === variable.key)) return prev;
      return [...prev, variable];
    });
  }, []);

  const removeCustomVariable = useCallback((key: string) => {
    setCustomVariables((prev) => prev.filter((v) => v.key !== key));
  }, []);

  const updateVariableChipStyle = useCallback((partial: Partial<VariableChipStyle>) => {
    setVariableChipStyle((prev) => ({ ...prev, ...partial }));
  }, []);

  // Merge pre-defined + custom variables
  const allVariables = useMemo(() => {
    const merged = [...predefinedVariables];
    for (const cv of customVariables) {
      if (!merged.some((v) => v.key === cv.key)) {
        merged.push(cv);
      }
    }
    return merged;
  }, [predefinedVariables, customVariables]);

  // Notify parent when custom variables change (strict-mode safe)
  const onVariablesChangeRef = useRef(onVariablesChange);
  onVariablesChangeRef.current = onVariablesChange;
  const isFirstVariablesRender = useRef(true);
  useEffect(() => {
    if (isFirstVariablesRender.current) {
      isFirstVariablesRender.current = false;
      return;
    }
    onVariablesChangeRef.current?.(customVariables);
    // Reset flag on cleanup so strict-mode remount skips the callback again
    return () => {
      isFirstVariablesRender.current = true;
    };
  }, [customVariables]);

  return {
    customVariables,
    allVariables,
    variableChipStyle,
    addCustomVariable,
    removeCustomVariable,
    updateVariableChipStyle,
  };
}
