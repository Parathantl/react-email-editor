import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditor } from '../../context/EditorContext';
import { COLOR_PRESETS } from '../../constants';
import styles from '../../styles/toolbar.module.css';

interface RichTextToolbarProps {
  editor: Editor | null;
}

/** Prevent mousedown on buttons only so editor keeps focus, but allow selects to work natively */
function preventBlur(e: React.MouseEvent) {
  const target = e.target as HTMLElement;
  const tag = target.tagName.toLowerCase();
  // Allow native behavior for select, option, and color input
  if (tag === 'select' || tag === 'option' || (tag === 'input' && (target as HTMLInputElement).type === 'color')) {
    return;
  }
  e.preventDefault();
}

export function RichTextToolbar({ editor }: RichTextToolbarProps) {
  if (!editor) return null;

  return (
    <div className={styles.richTextToolbar} onMouseDown={preventBlur}>
      {/* Font Family */}
      <FontFamilySelect editor={editor} />

      <div className={styles.richTextSeparator} />

      {/* Font Size */}
      <FontSizeSelect editor={editor} />

      <div className={styles.richTextSeparator} />

      {/* Bold / Italic / Underline */}
      <button
        className={`${styles.richTextBtn} ${editor.isActive('bold') ? styles.richTextBtnActive : ''}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </button>
      <button
        className={`${styles.richTextBtn} ${editor.isActive('italic') ? styles.richTextBtnActive : ''}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </button>
      <button
        className={`${styles.richTextBtn} ${editor.isActive('underline') ? styles.richTextBtnActive : ''}`}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
      >
        <u>U</u>
      </button>
      <button
        className={`${styles.richTextBtn} ${editor.isActive('strike') ? styles.richTextBtnActive : ''}`}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough (Ctrl+Shift+X)"
      >
        <s>S</s>
      </button>

      <div className={styles.richTextSeparator} />

      {/* Text Color */}
      <InlineColorPicker
        editor={editor}
        type="color"
        title="Text Color"
        label="A"
      />

      {/* Highlight Color */}
      <InlineColorPicker
        editor={editor}
        type="highlight"
        title="Highlight"
        label="H"
      />

      <div className={styles.richTextSeparator} />

      {/* Alignment */}
      <button
        className={`${styles.richTextBtn} ${editor.isActive({ textAlign: 'left' }) ? styles.richTextBtnActive : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title="Align Left"
      >
        L
      </button>
      <button
        className={`${styles.richTextBtn} ${editor.isActive({ textAlign: 'center' }) ? styles.richTextBtnActive : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title="Align Center"
      >
        C
      </button>
      <button
        className={`${styles.richTextBtn} ${editor.isActive({ textAlign: 'right' }) ? styles.richTextBtnActive : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title="Align Right"
      >
        R
      </button>

      <div className={styles.richTextSeparator} />

      {/* Lists */}
      <button
        className={`${styles.richTextBtn} ${editor.isActive('bulletList') ? styles.richTextBtnActive : ''}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        &#8226;
      </button>
      <button
        className={`${styles.richTextBtn} ${editor.isActive('orderedList') ? styles.richTextBtnActive : ''}`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Ordered List"
      >
        1.
      </button>

      <div className={styles.richTextSeparator} />

      {/* Link */}
      <InlineLinkEditor editor={editor} />

      {/* Clear formatting */}
      <button
        className={styles.richTextBtn}
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
        title="Clear Formatting"
      >
        &#10006;
      </button>
    </div>
  );
}

// ---- Font Family Select ----

function FontFamilySelect({ editor }: { editor: Editor }) {
  const { fontFamilies } = useEditor();
  const currentFont = editor.getAttributes('textStyle').fontFamily || '';

  // Include current font if it's not in the predefined list
  const fonts = fontFamilies.slice();
  if (currentFont && !fonts.some((f) => f.toLowerCase() === currentFont.toLowerCase())) {
    fonts.push(currentFont);
  }

  return (
    <select
      className={styles.richTextSelect}
      value={currentFont}
      onChange={(e) => {
        const value = e.target.value;
        if (value) {
          editor.chain().focus().setFontFamily(value).run();
        } else {
          editor.chain().focus().unsetFontFamily().run();
        }
      }}
      title="Font Family"
    >
      <option value="">Default</option>
      {fonts.map((font) => (
        <option key={font} value={font} style={{ fontFamily: font }}>
          {font.split(',')[0].trim()}
        </option>
      ))}
    </select>
  );
}

// ---- Font Size Select ----

function FontSizeSelect({ editor }: { editor: Editor }) {
  const { fontSizes } = useEditor();
  const currentSize = editor.getAttributes('textStyle').fontSize || '';

  // Build size list, including current size if it's not in the predefined list
  const sizes = fontSizes.slice();
  if (currentSize && !sizes.includes(currentSize)) {
    sizes.push(currentSize);
    sizes.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }

  return (
    <select
      className={styles.richTextSelectSmall}
      value={currentSize}
      onChange={(e) => {
        const value = e.target.value;
        if (value) {
          editor.chain().focus().setFontSize(value).run();
        } else {
          editor.chain().focus().unsetFontSize().run();
        }
      }}
      title="Font Size"
    >
      <option value="">Size</option>
      {sizes.map((size) => (
        <option key={size} value={size}>
          {parseInt(size, 10)}
        </option>
      ))}
    </select>
  );
}

// ---- Inline Color Picker ----

interface InlineColorPickerProps {
  editor: Editor;
  type: 'color' | 'highlight';
  title: string;
  label: string;
}

// ---- Inline Link Editor ----

function InlineLinkEditor({ editor }: { editor: Editor }) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = editor.isActive('link');
  const currentHref = editor.getAttributes('link').href || '';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleOpen = useCallback(() => {
    setUrl(currentHref);
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [currentHref]);

  const handleApply = useCallback(() => {
    if (url.trim()) {
      editor.chain().focus().setLink({ href: url.trim() }).run();
    }
    setIsOpen(false);
  }, [editor, url]);

  const handleRemove = useCallback(() => {
    editor.chain().focus().unsetLink().run();
    setIsOpen(false);
    setUrl('');
  }, [editor]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleApply();
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [handleApply],
  );

  return (
    <div className={styles.richTextColorWrapper} ref={wrapperRef}>
      <button
        className={`${styles.richTextBtn} ${isActive ? styles.richTextBtnActive : ''}`}
        onClick={handleOpen}
        title="Link"
      >
        &#128279;
      </button>
      {isOpen && (
        <div className={styles.richTextLinkDropdown}>
          <label className={styles.richTextLinkLabel}>URL</label>
          <input
            ref={inputRef}
            className={styles.richTextLinkInput}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://, mailto:, or tel:"
          />
          <div className={styles.richTextLinkActions}>
            <button className={styles.richTextLinkApply} onClick={handleApply}>
              Apply
            </button>
            {isActive && (
              <button className={styles.richTextLinkRemove} onClick={handleRemove}>
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InlineColorPicker({ editor, type, title, label }: InlineColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const currentColor =
    type === 'color'
      ? editor.getAttributes('textStyle').color || '#000000'
      : editor.getAttributes('highlight').color || '';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const applyColor = useCallback(
    (color: string) => {
      if (type === 'color') {
        editor.chain().focus().setColor(color).run();
      } else {
        editor.chain().focus().toggleHighlight({ color }).run();
      }
      setIsOpen(false);
    },
    [editor, type],
  );

  const clearColor = useCallback(() => {
    if (type === 'color') {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().unsetHighlight().run();
    }
    setIsOpen(false);
  }, [editor, type]);

  const indicatorColor = type === 'color' ? currentColor : (currentColor || 'transparent');

  return (
    <div className={styles.richTextColorWrapper} ref={wrapperRef}>
      <button
        className={styles.richTextBtn}
        onClick={() => setIsOpen(!isOpen)}
        title={title}
      >
        <span className={styles.richTextColorLabel}>{label}</span>
        <span
          className={styles.richTextColorIndicator}
          style={{ backgroundColor: indicatorColor }}
        />
      </button>
      {isOpen && (
        <div className={styles.richTextColorDropdown}>
          <div className={styles.richTextColorGrid}>
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                className={styles.richTextColorSwatch}
                style={{ backgroundColor: color }}
                onClick={() => applyColor(color)}
                title={color}
              />
            ))}
          </div>
          <div className={styles.richTextColorActions}>
            <input
              type="color"
              value={currentColor || '#000000'}
              onChange={(e) => applyColor(e.target.value)}
              className={styles.richTextColorInput}
              title="Custom color"
            />
            <button
              className={styles.richTextColorClearBtn}
              onClick={clearColor}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
