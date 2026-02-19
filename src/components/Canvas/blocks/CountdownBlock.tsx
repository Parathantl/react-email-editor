import React, { useState, useEffect, useMemo } from 'react';
import type { Block } from '../../../types';
import styles from '../../../styles/blocks.module.css';

interface CountdownBlockProps {
  block: Block;
}

function getTimeRemaining(targetDate: string) {
  const total = Math.max(0, new Date(targetDate).getTime() - Date.now());
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

export const CountdownBlock = React.memo(function CountdownBlock({ block }: CountdownBlockProps) {
  const p = block.properties;
  const [time, setTime] = useState(() => getTimeRemaining(p.targetDate));

  useEffect(() => {
    setTime(getTimeRemaining(p.targetDate));
    const interval = setInterval(() => {
      setTime(getTimeRemaining(p.targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [p.targetDate]);

  const units = [
    { value: time.days, label: 'Days' },
    { value: time.hours, label: 'Hours' },
    { value: time.minutes, label: 'Minutes' },
    { value: time.seconds, label: 'Seconds' },
  ];

  const alignStyle =
    p.align === 'left'
      ? 'flex-start'
      : p.align === 'right'
        ? 'flex-end'
        : 'center';

  const wrapperStyle = useMemo(() => ({
    padding: p.padding, justifyContent: alignStyle,
  }), [p.padding, alignStyle]);

  const labelStyle = useMemo(() => ({
    color: p.labelColor, textAlign: p.align as React.CSSProperties['textAlign'],
  }), [p.labelColor, p.align]);

  const digitsContainerStyle = useMemo(() => ({
    justifyContent: alignStyle,
  }), [alignStyle]);

  const digitBoxStyle = useMemo(() => ({
    backgroundColor: p.digitBackgroundColor,
    color: p.digitColor,
    fontSize: p.fontSize,
  }), [p.digitBackgroundColor, p.digitColor, p.fontSize]);

  const unitLabelStyle = useMemo(() => ({
    color: p.labelColor,
  }), [p.labelColor]);

  return (
    <div className={`ee-block-countdown ${styles.countdownBlock}`} style={wrapperStyle}>
      {p.label && (
        <div className={styles.countdownLabel} style={labelStyle}>
          {p.label}
        </div>
      )}
      <div className={styles.countdownDigits} style={digitsContainerStyle}>
        {units.map((unit) => (
          <div key={unit.label} className={styles.countdownUnit}>
            <div
              className={styles.countdownDigitBox}
              style={digitBoxStyle}
            >
              {String(unit.value).padStart(2, '0')}
            </div>
            <div className={styles.countdownUnitLabel} style={unitLabelStyle}>
              {unit.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
