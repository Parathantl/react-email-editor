import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorFonts, useColorPresets } from '../../context/EditorContext';
import { isSafeURL } from '../../utils/sanitize';
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
    <div className={`ee-richtext-toolbar ${styles.richTextToolbar}`} onMouseDown={preventBlur}>
      {/* Font Family */}
      <FontFamilySelect editor={editor} />

      <div className={`ee-richtext-separator ${styles.richTextSeparator}`} />

      {/* Font Size */}
      <FontSizeSelect editor={editor} />

      <div className={`ee-richtext-separator ${styles.richTextSeparator}`} />

      {/* Bold / Italic / Underline */}
      <button
        className={`ee-richtext-btn ee-richtext-bold ${styles.richTextBtn} ${editor.isActive('bold') ? styles.richTextBtnActive : ''}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
        aria-label="Bold (Ctrl+B)"
        aria-pressed={editor.isActive('bold')}
      >
        <strong>B</strong>
      </button>
      <button
        className={`ee-richtext-btn ee-richtext-italic ${styles.richTextBtn} ${editor.isActive('italic') ? styles.richTextBtnActive : ''}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
        aria-label="Italic (Ctrl+I)"
        aria-pressed={editor.isActive('italic')}
      >
        <em>I</em>
      </button>
      <button
        className={`ee-richtext-btn ee-richtext-underline ${styles.richTextBtn} ${editor.isActive('underline') ? styles.richTextBtnActive : ''}`}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
        aria-label="Underline (Ctrl+U)"
        aria-pressed={editor.isActive('underline')}
      >
        <u>U</u>
      </button>
      <button
        className={`ee-richtext-btn ee-richtext-strike ${styles.richTextBtn} ${editor.isActive('strike') ? styles.richTextBtnActive : ''}`}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough (Ctrl+Shift+X)"
        aria-label="Strikethrough (Ctrl+Shift+X)"
        aria-pressed={editor.isActive('strike')}
      >
        <s>S</s>
      </button>

      <div className={`ee-richtext-separator ${styles.richTextSeparator}`} />

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

      <div className={`ee-richtext-separator ${styles.richTextSeparator}`} />

      {/* Alignment */}
      <button
        className={`ee-richtext-btn ee-richtext-align-left ${styles.richTextBtn} ${editor.isActive({ textAlign: 'left' }) ? styles.richTextBtnActive : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title="Align Left"
        aria-label="Align Left"
        aria-pressed={editor.isActive({ textAlign: 'left' })}
      >
        L
      </button>
      <button
        className={`ee-richtext-btn ee-richtext-align-center ${styles.richTextBtn} ${editor.isActive({ textAlign: 'center' }) ? styles.richTextBtnActive : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title="Align Center"
        aria-label="Align Center"
        aria-pressed={editor.isActive({ textAlign: 'center' })}
      >
        C
      </button>
      <button
        className={`ee-richtext-btn ee-richtext-align-right ${styles.richTextBtn} ${editor.isActive({ textAlign: 'right' }) ? styles.richTextBtnActive : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title="Align Right"
        aria-label="Align Right"
        aria-pressed={editor.isActive({ textAlign: 'right' })}
      >
        R
      </button>

      <div className={`ee-richtext-separator ${styles.richTextSeparator}`} />

      {/* Lists */}
      <button
        className={`ee-richtext-btn ee-richtext-bullet-list ${styles.richTextBtn} ${editor.isActive('bulletList') ? styles.richTextBtnActive : ''}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
        aria-label="Bullet List"
        aria-pressed={editor.isActive('bulletList')}
      >
        &#8226;
      </button>
      <button
        className={`ee-richtext-btn ee-richtext-ordered-list ${styles.richTextBtn} ${editor.isActive('orderedList') ? styles.richTextBtnActive : ''}`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Ordered List"
        aria-label="Ordered List"
        aria-pressed={editor.isActive('orderedList')}
      >
        1.
      </button>

      <div className={`ee-richtext-separator ${styles.richTextSeparator}`} />

      {/* Link */}
      <InlineLinkEditor editor={editor} />

      {/* Clear formatting */}
      <button
        className={`ee-richtext-btn ee-richtext-clear ${styles.richTextBtn}`}
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
        title="Clear Formatting"
        aria-label="Clear Formatting"
      >
        &#10006;
      </button>
    </div>
  );
}

// ---- Font Family Select ----

function FontFamilySelect({ editor }: { editor: Editor }) {
  const { fontFamilies } = useEditorFonts();
  const currentFont = editor.getAttributes('textStyle').fontFamily || '';

  // Include current font if it's not in the predefined list
  const fonts = fontFamilies.slice();
  if (currentFont && !fonts.some((f) => f.toLowerCase() === currentFont.toLowerCase())) {
    fonts.push(currentFont);
  }

  return (
    <select
      className={`ee-richtext-font-select ${styles.richTextSelect}`}
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
  const { fontSizes } = useEditorFonts();
  const currentSize = editor.getAttributes('textStyle').fontSize || '';

  // Build size list, including current size if it's not in the predefined list
  const sizes = fontSizes.slice();
  if (currentSize && !sizes.includes(currentSize)) {
    sizes.push(currentSize);
    sizes.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }

  return (
    <select
      className={`ee-richtext-size-select ${styles.richTextSelectSmall}`}
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
    setUrlError('');
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [currentHref]);

  const [urlError, setUrlError] = useState('');

  const handleApply = useCallback(() => {
    const trimmed = url.trim();
    if (trimmed) {
      if (!isSafeURL(trimmed)) {
        setUrlError('Only http, https, mailto, and tel URLs are allowed');
        return;
      }
      setUrlError('');
      editor.chain().focus().setLink({ href: trimmed }).run();
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
    <div className={`ee-richtext-link ${styles.richTextColorWrapper}`} ref={wrapperRef}>
      <button
        className={`ee-richtext-btn ee-richtext-link-btn ${styles.richTextBtn} ${isActive ? styles.richTextBtnActive : ''}`}
        onClick={handleOpen}
        title="Link"
        aria-label="Link"
        aria-pressed={isActive}
      >
        &#128279;
      </button>
      {isOpen && (
        <div className={`ee-richtext-link-dropdown ${styles.richTextLinkDropdown}`}>
          <label className={`ee-richtext-link-label ${styles.richTextLinkLabel}`}>URL</label>
          <input
            ref={inputRef}
            className={`ee-richtext-link-input ${styles.richTextLinkInput}`}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://, mailto:, or tel:"
          />
          {urlError && <div className={`ee-richtext-link-error ${styles.richTextLinkError}`}>{urlError}</div>}
          <div className={`ee-richtext-link-actions ${styles.richTextLinkActions}`}>
            <button className={`ee-richtext-link-apply ${styles.richTextLinkApply}`} onClick={handleApply}>
              Apply
            </button>
            {isActive && (
              <button className={`ee-richtext-link-remove ${styles.richTextLinkRemove}`} onClick={handleRemove}>
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
  const { customColorPresets, addCustomColorPreset, removeCustomColorPreset } = useColorPresets();

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

  const handleSavePreset = useCallback(() => {
    if (currentColor && !customColorPresets.includes(currentColor)) {
      addCustomColorPreset(currentColor);
    }
  }, [currentColor, customColorPresets, addCustomColorPreset]);

  const indicatorColor = type === 'color' ? currentColor : (currentColor || 'transparent');

  return (
    <div className={`ee-richtext-color ee-richtext-color--${type} ${styles.richTextColorWrapper}`} ref={wrapperRef}>
      <button
        className={`ee-richtext-btn ee-richtext-color-btn ${styles.richTextBtn}`}
        onClick={() => setIsOpen(!isOpen)}
        title={title}
        aria-label={title}
        aria-expanded={isOpen}
      >
        <span className={`ee-richtext-color-label ${styles.richTextColorLabel}`}>{label}</span>
        <span
          className={`ee-richtext-color-indicator ${styles.richTextColorIndicator}`}
          style={{ backgroundColor: indicatorColor }}
        />
      </button>
      {isOpen && (
        <div className={`ee-richtext-color-dropdown ${styles.richTextColorDropdown}`}>
          <div className={`ee-richtext-color-grid ${styles.richTextColorGrid}`}>
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                className={`ee-richtext-color-swatch ${styles.richTextColorSwatch}`}
                style={{ backgroundColor: color }}
                onClick={() => applyColor(color)}
                title={color}
              />
            ))}
            {customColorPresets.length > 0 && customColorPresets.map((color) => (
              <button
                key={`custom-${color}`}
                className={`ee-richtext-color-swatch ${styles.richTextColorSwatch}`}
                style={{ backgroundColor: color }}
                onClick={() => applyColor(color)}
                onContextMenu={(e) => { e.preventDefault(); removeCustomColorPreset(color); }}
                title={`${color} (right-click to remove)`}
              />
            ))}
          </div>
          <div className={`ee-richtext-color-actions ${styles.richTextColorActions}`}>
            <input
              type="color"
              value={currentColor || '#000000'}
              onChange={(e) => applyColor(e.target.value)}
              className={`ee-richtext-color-input ${styles.richTextColorInput}`}
              title="Custom color"
            />
            <button
              className={`ee-richtext-color-save ${styles.richTextColorClearBtn}`}
              onClick={handleSavePreset}
              title="Save current color as preset"
              disabled={!currentColor || customColorPresets.includes(currentColor)}
            >
              + Save
            </button>
            <button
              className={`ee-richtext-color-clear ${styles.richTextColorClearBtn}`}
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
