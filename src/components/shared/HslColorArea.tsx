import React, { useRef, useCallback, useEffect, useState } from 'react';
import { hexToHsl, hslToHex } from '../../utils/colorConvert';
import styles from '../../styles/colorArea.module.css';

interface HslColorAreaProps {
  value: string; // hex like "#3b82f6"
  onChange: (hex: string) => void;
  /** Fires once when a drag ends (pointer up). Use for expensive operations like editor transactions. */
  onChangeEnd?: (hex: string) => void;
}

export function HslColorArea({ value, onChange, onChangeEnd }: HslColorAreaProps) {
  const [hsl, setHsl] = useState(() => hexToHsl(value));
  const areaRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const draggingArea = useRef(false);
  const draggingHue = useRef(false);
  const latestHex = useRef(value);

  // Sync internal HSL when value prop changes externally
  useEffect(() => {
    const parsed = hexToHsl(value);
    setHsl(parsed);
  }, [value]);

  const emitColor = useCallback(
    (h: number, s: number, l: number) => {
      setHsl({ h, s, l });
      const hex = hslToHex(h, s, l);
      latestHex.current = hex;
      onChange(hex);
    },
    [onChange],
  );

  // --- Saturation / Lightness area drag ---
  const handleAreaPointer = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      const rect = areaRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      const s = Math.round((x / rect.width) * 100);
      const l = Math.round(100 - (y / rect.height) * 100);
      emitColor(hsl.h, s, l);
    },
    [hsl.h, emitColor],
  );

  const onAreaPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      draggingArea.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      handleAreaPointer(e);
    },
    [handleAreaPointer],
  );

  const onAreaPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingArea.current) return;
      handleAreaPointer(e);
    },
    [handleAreaPointer],
  );

  const onAreaPointerUp = useCallback(() => {
    draggingArea.current = false;
    onChangeEnd?.(latestHex.current);
  }, [onChangeEnd]);

  // --- Hue bar drag ---
  const handleHuePointer = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      const rect = hueRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const h = Math.round((x / rect.width) * 360);
      emitColor(h, hsl.s, hsl.l);
    },
    [hsl.s, hsl.l, emitColor],
  );

  const onHuePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      draggingHue.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      handleHuePointer(e);
    },
    [handleHuePointer],
  );

  const onHuePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingHue.current) return;
      handleHuePointer(e);
    },
    [handleHuePointer],
  );

  const onHuePointerUp = useCallback(() => {
    draggingHue.current = false;
    onChangeEnd?.(latestHex.current);
  }, [onChangeEnd]);

  // CSS gradient for the SL area uses current hue
  const areaBackground = `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsl.h}, 100%, 50%))`;

  return (
    <div className={styles.hslPicker}>
      {/* Saturation / Lightness area */}
      <div
        ref={areaRef}
        className={styles.hslArea}
        style={{ background: areaBackground }}
        onPointerDown={onAreaPointerDown}
        onPointerMove={onAreaPointerMove}
        onPointerUp={onAreaPointerUp}
      >
        <div
          className={styles.hslAreaThumb}
          style={{
            left: `${hsl.s}%`,
            top: `${100 - hsl.l}%`,
            backgroundColor: value,
          }}
        />
      </div>

      {/* Hue bar */}
      <div
        ref={hueRef}
        className={styles.hslHueBar}
        onPointerDown={onHuePointerDown}
        onPointerMove={onHuePointerMove}
        onPointerUp={onHuePointerUp}
      >
        <div
          className={styles.hslHueThumb}
          style={{
            left: `${(hsl.h / 360) * 100}%`,
            backgroundColor: `hsl(${hsl.h}, 100%, 50%)`,
          }}
        />
      </div>
    </div>
  );
}
