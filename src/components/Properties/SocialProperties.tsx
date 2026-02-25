import React, { useCallback, useRef, useState } from 'react';
import type { Block, SocialElement } from '../../types';
import { narrowBlock } from '../../types';
import { useBlockUpdate } from '../../hooks/useBlockUpdate';
import { useImageAdapter } from '../../context/EditorContext';
import { useImageUpload } from '../ImageUpload/useImageUpload';
import { generateId } from '../../utils/id';
import { getSocialIcon } from '../Canvas/blocks/social-icons';
import { PropertyField, FieldSeparator } from './PropertyField';
import styles from '../../styles/properties.module.css';
import blockStyles from '../../styles/blocks.module.css';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp'];
const MAX_ICON_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

const MODE_OPTIONS = [
  { value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' },
];

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#3b5998',
  twitter: '#1da1f2',
  instagram: '#e1306c',
  linkedin: '#0077b5',
  youtube: '#ff0000',
  github: '#333333',
  pinterest: '#bd081c',
  snapchat: '#fffc00',
  tiktok: '#000000',
  web: '#4caf50',
};

interface SocialElementIconUploadProps {
  element: SocialElement;
  blockId: string;
  onUpdate: (changes: Partial<SocialElement>) => void;
}

function SocialElementIconUpload({ element, blockId, onUpdate }: SocialElementIconUploadProps) {
  const { imageUploadAdapter } = useImageAdapter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const { upload, status, error } = useImageUpload({
    adapter: imageUploadAdapter,
    blockId,
    onSuccess: (result) => {
      onUpdate({ src: result.url });
    },
  });

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setLocalError(null);
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setLocalError('Only PNG, JPG, GIF, SVG, and WebP files are allowed');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (file.size > MAX_ICON_SIZE_BYTES) {
        setLocalError('File size must be under 2MB');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      await upload(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [upload],
  );

  const bgColor = PLATFORM_COLORS[element.name] || '#999999';
  const SvgIcon = getSocialIcon(element.name);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
      <div
        className={blockStyles.socialIconPreview}
        style={{ backgroundColor: bgColor }}
      >
        {element.src ? (
          <img src={element.src} alt={element.name} />
        ) : SvgIcon ? (
          <SvgIcon size={16} color={element.color || '#ffffff'} />
        ) : (
          <span style={{ color: element.color || '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
            {element.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      {imageUploadAdapter && (
        <>
          <button
            className={`ee-upload-btn ${status === 'uploading' ? styles.fieldBtnUploadDisabled : styles.fieldBtnUpload}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={status === 'uploading'}
            style={{ flex: 1, fontSize: '11px', padding: '3px 6px' }}
          >
            {status === 'uploading' ? 'Uploading...' : 'Upload Icon'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.gif,.svg,.webp"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </>
      )}
      {element.src && (
        <button
          className={styles.itemActionBtnDanger}
          onClick={() => onUpdate({ src: undefined })}
          title="Reset to default icon"
          style={{ fontSize: '11px', padding: '3px 6px' }}
        >
          Reset
        </button>
      )}
      {(localError || error) && <span className={styles.validationError} style={{ fontSize: '10px' }}>{localError || error}</span>}
    </div>
  );
}

interface SocialPropertiesProps {
  block: Block;
}

export function SocialProperties({ block }: SocialPropertiesProps) {
  const update = useBlockUpdate(block.id);

  const updateElement = useCallback(
    (index: number, changes: Partial<SocialElement>) => {
      const elements = [...block.properties.elements];
      elements[index] = { ...elements[index], ...changes };
      update({ elements });
    },
    [block.properties.elements, update],
  );

  const addElement = useCallback(() => {
    const elements = [...block.properties.elements, { id: generateId('se'), name: 'web', href: '#' }];
    update({ elements });
  }, [block.properties.elements, update]);

  const removeElement = useCallback(
    (index: number) => {
      const elements = block.properties.elements.filter((_: any, i: number) => i !== index);
      update({ elements });
    },
    [block.properties.elements, update],
  );

  const moveElement = useCallback(
    (index: number, direction: -1 | 1) => {
      const elements = [...block.properties.elements];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= elements.length) return;
      [elements[index], elements[newIndex]] = [elements[newIndex], elements[index]];
      update({ elements });
    },
    [block.properties.elements, update],
  );

  if (!narrowBlock(block, 'social')) return null;
  const p = block.properties;

  return (
    <div className={styles.propertiesBody}>
      <PropertyField type="select" label="Mode" value={p.mode} onChange={(v) => update({ mode: v })} options={MODE_OPTIONS} />
      <PropertyField type="alignment" label="Alignment" value={p.align} onChange={(v) => update({ align: v })} />
      <PropertyField type="text" label="Icon Size" value={p.iconSize} onChange={(v) => update({ iconSize: v })} />
      <PropertyField type="text" label="Icon Padding" value={p.iconPadding} onChange={(v) => update({ iconPadding: v })} />
      <PropertyField type="text" label="Border Radius" value={p.borderRadius} onChange={(v) => update({ borderRadius: v })} />
      <PropertyField type="color" label="Text Color" value={p.color} onChange={(v) => update({ color: v })} />
      <PropertyField type="text" label="Font Size" value={p.fontSize} onChange={(v) => update({ fontSize: v })} />
      <PropertyField type="padding" label="Padding" value={p.padding} onChange={(v) => update({ padding: v })} />
      <FieldSeparator />
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Social Elements</label>
        <div className={blockStyles.socialElementsContainer}>
          {p.elements.map((element: SocialElement, index: number) => (
            <div key={element.id ?? `se-${index}`} className={blockStyles.socialElementItem}>
              <div className={styles.fieldRow}>
                <select
                  className={`${styles.fieldSelect} ${styles.fieldInputFlex}`}
                  value={element.name}
                  onChange={(e) => updateElement(index, { name: e.target.value })}
                >
                  <option value="facebook">Facebook</option>
                  <option value="twitter">Twitter</option>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="youtube">YouTube</option>
                  <option value="github">GitHub</option>
                  <option value="pinterest">Pinterest</option>
                  <option value="snapchat">Snapchat</option>
                  <option value="tiktok">TikTok</option>
                  <option value="web">Web</option>
                </select>
                <button className={`ee-item-move-up ${styles.itemActionBtn}`} onClick={() => moveElement(index, -1)} disabled={index === 0} title="Move up">↑</button>
                <button className={`ee-item-move-down ${styles.itemActionBtn}`} onClick={() => moveElement(index, 1)} disabled={index === p.elements.length - 1} title="Move down">↓</button>
                <button className={`ee-item-remove ${styles.itemActionBtnDanger}`} onClick={() => removeElement(index)} title="Remove">×</button>
              </div>
              <input
                className={styles.fieldInputStacked}
                value={element.href}
                onChange={(e) => updateElement(index, { href: e.target.value })}
                placeholder="URL"
              />
              <input
                className={styles.fieldInputStacked}
                value={element.content || ''}
                onChange={(e) => updateElement(index, { content: e.target.value })}
                placeholder="Label (optional)"
              />
              <SocialElementIconUpload
                element={element}
                blockId={block.id}
                onUpdate={(changes) => updateElement(index, changes)}
              />
            </div>
          ))}
        </div>
        <button className={`ee-add-item ${styles.addItemBtn}`} onClick={addElement}>+ Add Element</button>
      </div>
    </div>
  );
}
