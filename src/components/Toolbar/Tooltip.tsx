import React, { useState, useRef, useCallback } from 'react';
import styles from '../../styles/toolbar.module.css';

interface TooltipProps {
  label: string;
  shortcut?: string;
  children: React.ReactElement;
}

export function Tooltip({ label, shortcut, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), 400);
  }, []);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setVisible(false);
  }, []);

  return (
    <span
      className={styles.richTextTooltipWrapper}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span className={styles.richTextTooltip} role="tooltip">
          <span>{label}</span>
          {shortcut && <kbd className={styles.richTextTooltipShortcut}>{shortcut}</kbd>}
        </span>
      )}
    </span>
  );
}
