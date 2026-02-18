import React, { useState, useEffect } from 'react';
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

  return (
    <div className={styles.countdownBlock} style={{ padding: p.padding, justifyContent: alignStyle }}>
      {p.label && (
        <div className={styles.countdownLabel} style={{ color: p.labelColor, textAlign: p.align }}>
          {p.label}
        </div>
      )}
      <div className={styles.countdownDigits} style={{ justifyContent: alignStyle }}>
        {units.map((unit, idx) => (
          <div key={idx} className={styles.countdownUnit}>
            <div
              className={styles.countdownDigitBox}
              style={{
                backgroundColor: p.digitBackgroundColor,
                color: p.digitColor,
                fontSize: p.fontSize,
              }}
            >
              {String(unit.value).padStart(2, '0')}
            </div>
            <div className={styles.countdownUnitLabel} style={{ color: p.labelColor }}>
              {unit.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
