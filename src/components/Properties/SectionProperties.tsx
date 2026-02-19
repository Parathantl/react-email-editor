import React, { useCallback } from 'react';
import type { Section } from '../../types';
import { useEditorDispatch } from '../../context/EditorContext';
import { PropertyField, FieldSeparator } from './PropertyField';
import styles from '../../styles/properties.module.css';

const BG_SIZE_OPTIONS = [
  { value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'auto', label: 'Auto' },
];

const BG_REPEAT_OPTIONS = [
  { value: 'no-repeat', label: 'No Repeat' }, { value: 'repeat', label: 'Repeat' },
  { value: 'repeat-x', label: 'Repeat X' }, { value: 'repeat-y', label: 'Repeat Y' },
];

interface SectionPropertiesProps {
  section: Section;
}

export function SectionProperties({ section }: SectionPropertiesProps) {
  const dispatch = useEditorDispatch();
  const { properties } = section;

  const update = useCallback(
    (props: Record<string, any>) => {
      dispatch({ type: 'UPDATE_SECTION', payload: { sectionId: section.id, properties: props } });
    },
    [dispatch, section.id],
  );

  return (
    <div className={styles.propertiesBody}>
      <PropertyField type="color" label="Background Color" value={properties.backgroundColor} onChange={(v) => update({ backgroundColor: v })} />
      <PropertyField type="padding" label="Padding" value={properties.padding} onChange={(v) => update({ padding: v })} />
      <PropertyField type="text" label="Border Radius" value={properties.borderRadius} onChange={(v) => update({ borderRadius: v })} />
      <PropertyField type="toggle" label="Full Width" value={properties.fullWidth || false} onChange={(v) => update({ fullWidth: v })} />
      <FieldSeparator />
      <PropertyField type="text" label="Background Image URL" value={properties.backgroundImage || ''} onChange={(v) => update({ backgroundImage: v })} placeholder="https://..." />
      <PropertyField type="select" label="Background Size" value={properties.backgroundSize || 'cover'} onChange={(v) => update({ backgroundSize: v })} options={BG_SIZE_OPTIONS} />
      <PropertyField type="select" label="Background Repeat" value={properties.backgroundRepeat || 'no-repeat'} onChange={(v) => update({ backgroundRepeat: v })} options={BG_REPEAT_OPTIONS} />
    </div>
  );
}
