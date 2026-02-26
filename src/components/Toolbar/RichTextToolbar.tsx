import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorFonts, useColorPresets } from '../../context/EditorContext';
import { isSafeURL } from '../../utils/sanitize';
import { COLOR_PRESETS } from '../../constants';
import { HslColorArea } from '../shared/HslColorArea';
import styles from '../../styles/toolbar.module.css';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon,
  BulletListIcon,
  OrderedListIcon,
  IndentIcon,
  OutdentIcon,
  TextColorIcon,
  HighlightIcon,
  LinkIcon,
  HorizontalRuleIcon,
  ClearFormattingIcon,
} from './toolbar-icons';
import { Tooltip } from './Tooltip';
import { applyIndent, applyOutdent } from '../../tiptap/Indent';

interface RichTextToolbarProps {
  editor: Editor | null;
}

/** Prevent mousedown on toolbar elements so editor keeps focus, but allow inputs/selects to work natively */
function preventBlur(e: React.MouseEvent) {
  const target = e.target as HTMLElement;
  const tag = target.tagName.toLowerCase();
  // Allow native behavior for interactive form controls (selects, inputs) so users can type/pick values
  if (tag === 'select' || tag === 'option' || tag === 'input') {
    return;
  }
  e.preventDefault();
}

export function RichTextToolbar({ editor }: RichTextToolbarProps) {
  if (!editor) return null;

  return (
    <div className={`ee-richtext-toolbar ${styles.richTextToolbar}`} onMouseDown={preventBlur}>
      {/* Group 1 — Typography */}
      <div className={`ee-richtext-group ${styles.richTextGroup}`}>
        <FontFamilySelect editor={editor} />
        <FontSizeSelect editor={editor} />
      </div>

      {/* Group 2 — Formatting */}
      <div className={`ee-richtext-group ${styles.richTextGroup}`}>
        <Tooltip label="Bold" shortcut="Ctrl+B">
          <button
            className={`ee-richtext-btn ee-richtext-bold ${styles.richTextBtn} ${editor.isActive('bold') ? styles.richTextBtnActive : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
            aria-pressed={editor.isActive('bold')}
          >
            <BoldIcon />
          </button>
        </Tooltip>
        <Tooltip label="Italic" shortcut="Ctrl+I">
          <button
            className={`ee-richtext-btn ee-richtext-italic ${styles.richTextBtn} ${editor.isActive('italic') ? styles.richTextBtnActive : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
            aria-pressed={editor.isActive('italic')}
          >
            <ItalicIcon />
          </button>
        </Tooltip>
        <Tooltip label="Underline" shortcut="Ctrl+U">
          <button
            className={`ee-richtext-btn ee-richtext-underline ${styles.richTextBtn} ${editor.isActive('underline') ? styles.richTextBtnActive : ''}`}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="Underline"
            aria-pressed={editor.isActive('underline')}
          >
            <UnderlineIcon />
          </button>
        </Tooltip>
        <Tooltip label="Strikethrough" shortcut="Ctrl+Shift+X">
          <button
            className={`ee-richtext-btn ee-richtext-strike ${styles.richTextBtn} ${editor.isActive('strike') ? styles.richTextBtnActive : ''}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            aria-label="Strikethrough"
            aria-pressed={editor.isActive('strike')}
          >
            <StrikethroughIcon />
          </button>
        </Tooltip>
      </div>

      {/* Group 3 — Colors */}
      <div className={`ee-richtext-group ${styles.richTextGroup}`}>
        <InlineColorPicker
          editor={editor}
          type="color"
          title="Text Color"
          icon={<TextColorIcon />}
        />
        <InlineColorPicker
          editor={editor}
          type="highlight"
          title="Highlight"
          icon={<HighlightIcon />}
        />
      </div>

      {/* Group 4 — Alignment */}
      <div className={`ee-richtext-group ${styles.richTextGroup}`}>
        <Tooltip label="Align Left" shortcut="Ctrl+Shift+L">
          <button
            className={`ee-richtext-btn ee-richtext-align-left ${styles.richTextBtn} ${editor.isActive({ textAlign: 'left' }) ? styles.richTextBtnActive : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            aria-label="Align Left"
            aria-pressed={editor.isActive({ textAlign: 'left' })}
          >
            <AlignLeftIcon />
          </button>
        </Tooltip>
        <Tooltip label="Align Center" shortcut="Ctrl+Shift+E">
          <button
            className={`ee-richtext-btn ee-richtext-align-center ${styles.richTextBtn} ${editor.isActive({ textAlign: 'center' }) ? styles.richTextBtnActive : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            aria-label="Align Center"
            aria-pressed={editor.isActive({ textAlign: 'center' })}
          >
            <AlignCenterIcon />
          </button>
        </Tooltip>
        <Tooltip label="Align Right" shortcut="Ctrl+Shift+R">
          <button
            className={`ee-richtext-btn ee-richtext-align-right ${styles.richTextBtn} ${editor.isActive({ textAlign: 'right' }) ? styles.richTextBtnActive : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            aria-label="Align Right"
            aria-pressed={editor.isActive({ textAlign: 'right' })}
          >
            <AlignRightIcon />
          </button>
        </Tooltip>
        <Tooltip label="Justify" shortcut="Ctrl+Shift+J">
          <button
            className={`ee-richtext-btn ee-richtext-align-justify ${styles.richTextBtn} ${editor.isActive({ textAlign: 'justify' }) ? styles.richTextBtnActive : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            aria-label="Justify"
            aria-pressed={editor.isActive({ textAlign: 'justify' })}
          >
            <AlignJustifyIcon />
          </button>
        </Tooltip>
      </div>

      {/* Group 5 — Lists */}
      <div className={`ee-richtext-group ${styles.richTextGroup}`}>
        <Tooltip label="Bullet List" shortcut="Ctrl+Shift+8">
          <button
            className={`ee-richtext-btn ee-richtext-bullet-list ${styles.richTextBtn} ${editor.isActive('bulletList') ? styles.richTextBtnActive : ''}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Bullet List"
            aria-pressed={editor.isActive('bulletList')}
          >
            <BulletListIcon />
          </button>
        </Tooltip>
        <Tooltip label="Ordered List" shortcut="Ctrl+Shift+7">
          <button
            className={`ee-richtext-btn ee-richtext-ordered-list ${styles.richTextBtn} ${editor.isActive('orderedList') ? styles.richTextBtnActive : ''}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Ordered List"
            aria-pressed={editor.isActive('orderedList')}
          >
            <OrderedListIcon />
          </button>
        </Tooltip>
        <Tooltip label="Outdent" shortcut="Shift+Tab">
          <button
            className={`ee-richtext-btn ee-richtext-outdent ${styles.richTextBtn}`}
            onClick={() => {
              if (editor.isActive('listItem')) {
                editor.chain().focus().liftListItem('listItem').run();
              } else {
                editor.commands.focus();
                applyOutdent(editor);
              }
            }}
            aria-label="Outdent"
          >
            <OutdentIcon />
          </button>
        </Tooltip>
        <Tooltip label="Indent" shortcut="Tab">
          <button
            className={`ee-richtext-btn ee-richtext-indent ${styles.richTextBtn}`}
            onClick={() => {
              if (editor.isActive('listItem')) {
                editor.chain().focus().sinkListItem('listItem').run();
              } else {
                editor.commands.focus();
                applyIndent(editor);
              }
            }}
            aria-label="Indent"
          >
            <IndentIcon />
          </button>
        </Tooltip>
      </div>

      {/* Group 6 — Utilities */}
      <div className={`ee-richtext-group ${styles.richTextGroup}`}>
        <InlineLinkEditor editor={editor} />
        <Tooltip label="Horizontal Rule">
          <button
            className={`ee-richtext-btn ee-richtext-hr ${styles.richTextBtn}`}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            aria-label="Horizontal Rule"
          >
            <HorizontalRuleIcon />
          </button>
        </Tooltip>
        <Tooltip label="Clear Formatting">
          <button
            className={`ee-richtext-btn ee-richtext-clear ${styles.richTextBtn}`}
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
            aria-label="Clear Formatting"
          >
            <ClearFormattingIcon />
          </button>
        </Tooltip>
      </div>
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
  icon: React.ReactNode;
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
        <LinkIcon />
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

function InlineColorPicker({ editor, type, title, icon }: InlineColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { customColorPresets, addCustomColorPreset, removeCustomColorPreset } = useColorPresets();

  const currentColor =
    type === 'color'
      ? editor.getAttributes('textStyle').color || '#000000'
      : editor.getAttributes('highlight').color || '';

  // Sync hex input when dropdown opens or current color changes
  useEffect(() => {
    if (isOpen) {
      setHexInput(currentColor || '#000000');
    }
  }, [isOpen, currentColor]);

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
    (color: string, close = false) => {
      if (type === 'color') {
        editor.chain().focus().setColor(color).run();
      } else {
        editor.chain().focus().toggleHighlight({ color }).run();
      }
      setHexInput(color);
      if (close) setIsOpen(false);
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

  const handleHexApply = useCallback(() => {
    const trimmed = hexInput.trim();
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
      applyColor(trimmed, true);
    }
  }, [hexInput, applyColor]);

  const handleHexKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleHexApply();
      }
    },
    [handleHexApply],
  );

  const handleSaveCustom = useCallback(() => {
    const trimmed = hexInput.trim();
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed) && !customColorPresets.includes(trimmed)) {
      addCustomColorPreset(trimmed);
    }
  }, [hexInput, customColorPresets, addCustomColorPreset]);

  const isValidHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hexInput.trim());
  const indicatorColor = type === 'color' ? currentColor : (currentColor || 'transparent');

  return (
    <div className={`ee-richtext-color ee-richtext-color--${type} ${styles.richTextColorWrapper}`} ref={wrapperRef}>
      <button
        className={`ee-richtext-btn ee-richtext-color-btn ${styles.richTextBtnWithIndicator}`}
        onClick={() => setIsOpen(!isOpen)}
        title={title}
        aria-label={title}
        aria-expanded={isOpen}
      >
        {icon}
        <span
          className={`ee-richtext-color-indicator ${styles.richTextColorIndicator}`}
          style={{ backgroundColor: indicatorColor }}
        />
      </button>
      {isOpen && (
        <div className={`ee-richtext-color-dropdown ${styles.richTextColorDropdown}`}>
          {/* Preset colors */}
          <div className={`ee-richtext-color-section-label ${styles.richTextColorSectionLabel}`}>Presets</div>
          <div className={`ee-richtext-color-grid ${styles.richTextColorGrid}`}>
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                className={`ee-richtext-color-swatch ${styles.richTextColorSwatch} ${currentColor.toLowerCase() === color.toLowerCase() ? styles.richTextColorSwatchActive : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => applyColor(color, true)}
                title={color}
              />
            ))}
          </div>

          {/* Custom saved colors */}
          {customColorPresets.length > 0 && (
            <>
              <div className={`ee-richtext-color-section-label ${styles.richTextColorSectionLabel}`}>Custom</div>
              <div className={`ee-richtext-color-grid ${styles.richTextColorGrid}`}>
                {customColorPresets.map((color) => (
                  <button
                    key={`custom-${color}`}
                    className={`ee-richtext-color-swatch ${styles.richTextColorSwatch} ${currentColor.toLowerCase() === color.toLowerCase() ? styles.richTextColorSwatchActive : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => applyColor(color, true)}
                    title={color}
                  >
                    <span
                      className={`ee-richtext-color-swatch-remove ${styles.richTextColorSwatchRemove}`}
                      onClick={(e) => { e.stopPropagation(); removeCustomColorPreset(color); }}
                      title="Remove"
                    >
                      &times;
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* HSL color picker area */}
          <div style={{ borderTop: '1px solid var(--ee-border-color)', paddingTop: 'var(--ee-space-sm)' }}>
            <HslColorArea
              value={isValidHex ? hexInput.trim() : (currentColor || '#000000')}
              onChange={(hex) => { setHexInput(hex); }}
              onChangeEnd={(hex) => { applyColor(hex); }}
            />
          </div>

          {/* Custom color input row: hex + apply */}
          <div className={`ee-richtext-color-custom-row ${styles.richTextColorCustomRow}`}>
            <input
              className={`ee-richtext-color-hex-input ${styles.richTextColorHexInput}`}
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              onKeyDown={handleHexKeyDown}
              placeholder="#000000"
              maxLength={7}
              spellCheck={false}
            />
            <button
              className={`ee-richtext-color-apply ${styles.richTextColorApplyBtn}`}
              onClick={handleHexApply}
              disabled={!isValidHex}
              title="Apply color"
            >
              Apply
            </button>
          </div>

          {/* Bottom actions: save + clear */}
          <div className={`ee-richtext-color-bottom ${styles.richTextColorBottomActions}`}>
            <button
              className={`ee-richtext-color-save ${styles.richTextColorClearBtn}`}
              onClick={handleSaveCustom}
              title="Save this color to your custom presets"
              disabled={!isValidHex || customColorPresets.includes(hexInput.trim())}
            >
              + Save preset
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
