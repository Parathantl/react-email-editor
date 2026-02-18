// Main component
export { EmailEditor } from './components/EmailEditor';

// Context & hooks
export {
  EditorProvider,
  useEditor,
  useEditorState,
  useEditorDispatch,
  useSelectedBlock,
  useSelectedSection,
} from './context/EditorContext';

// Types
export type {
  BlockType,
  Block,
  Column,
  Section,
  SectionProperties,
  EmailTemplate,
  GlobalStyles,
  Variable,
  ImageUploadAdapter,
  UploadOptions,
  UploadResult,
  BrowseResult,
  TransformOptions,
  EmailEditorProps,
  EmailEditorRef,
  ActiveTab,
  SelectionState,
  EditorState,
  EditorAction,
  TextBlockProperties,
  ButtonBlockProperties,
  ImageBlockProperties,
  DividerBlockProperties,
  SpacerBlockProperties,
  BlockProperties,
  BlockPropertiesMap,
  VariableChipStyle,
  HeadMetadata,
  SocialElement,
  SocialBlockProperties,
  CountdownBlockProperties,
  MenuItem,
  MenuBlockProperties,
  HeroBlockProperties,
  PersistenceAdapter,
} from './types';

// MJML utilities
export { parseMJML } from './mjml/parser';
export { generateMJML } from './mjml/generator';
export { compileMJMLToHTML } from './mjml/compiler';

// TipTap extensions (for custom configurations)
export { getExtensions } from './tiptap/extensions';
export { VariableNode } from './tiptap/VariableNode';

// Utilities
export { generateId, generateBlockId, generateSectionId, generateColumnId } from './utils/id';
export { extractVariableKeys, replaceVariables, groupVariables } from './utils/variables';
export { sanitizeHTML, escapeHTML } from './utils/sanitize';
export { localStorageAdapter } from './utils/persistence';

// Block type registries (for extending with custom block types)
export {
  registerBlockRenderer,
  registerBlockProperties,
  registerBlockGenerator,
  registerBlockParser,
} from './registry';

// Constants
export {
  DEFAULT_BLOCK_PROPERTIES,
  DEFAULT_SECTION_PROPERTIES,
  DEFAULT_GLOBAL_STYLES,
  DEFAULT_HEAD_METADATA,
  DEFAULT_SOCIAL_PROPERTIES,
  DEFAULT_VARIABLE_CHIP_STYLE,
  DEFAULT_FONT_SIZES,
  BLOCK_DEFINITIONS,
  FONT_OPTIONS,
  COLOR_PRESETS,
  COLUMN_LAYOUTS,
} from './constants';
