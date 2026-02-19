// ---- Block Types ----

export type BlockType = 'text' | 'button' | 'image' | 'divider' | 'spacer' | 'social' | 'html' | 'video' | 'heading' | 'countdown' | 'menu' | 'hero';

export interface TextBlockProperties {
  content: string; // TipTap JSON string
  fontFamily: string;
  fontSize: string;
  color: string;
  lineHeight: string;
  padding: string;
  align: 'left' | 'center' | 'right' | 'justify';
  fontWeight: string;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing: string;
}

export interface ButtonBlockProperties {
  text: string;
  href: string;
  backgroundColor: string;
  color: string;
  fontFamily: string;
  fontSize: string;
  borderRadius: string;
  padding: string;
  innerPadding: string;
  align: 'left' | 'center' | 'right';
  width: string;
  fontWeight: string;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing: string;
}

export interface ImageBlockProperties {
  src: string;
  alt: string;
  href: string;
  width: string;
  height: string;
  padding: string;
  align: 'left' | 'center' | 'right';
  fluidOnMobile: boolean;
}

export interface DividerBlockProperties {
  borderColor: string;
  borderWidth: string;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  padding: string;
  width: string;
}

export interface SpacerBlockProperties {
  height: string;
}

export interface SocialElement {
  id?: string;
  name: string;
  href: string;
  src?: string;
  content?: string;
  backgroundColor?: string;
  color?: string;
}

export interface SocialBlockProperties {
  elements: SocialElement[];
  mode: 'horizontal' | 'vertical';
  align: 'left' | 'center' | 'right';
  iconSize: string;
  iconPadding: string;
  padding: string;
  fontSize: string;
  color: string;
  borderRadius: string;
}

export interface HtmlBlockProperties {
  content: string;
  padding: string;
}

export interface VideoBlockProperties {
  src: string;
  thumbnailUrl: string;
  alt: string;
  padding: string;
  align: 'left' | 'center' | 'right';
}

export interface HeadingBlockProperties {
  content: string;
  level: 'h1' | 'h2' | 'h3' | 'h4';
  fontFamily: string;
  fontSize: string;
  color: string;
  lineHeight: string;
  fontWeight: string;
  padding: string;
  align: 'left' | 'center' | 'right' | 'justify';
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing: string;
}

export interface CountdownBlockProperties {
  targetDate: string;
  label: string;
  digitBackgroundColor: string;
  digitColor: string;
  labelColor: string;
  fontSize: string;
  padding: string;
  align: 'left' | 'center' | 'right';
}

export interface MenuItem {
  id?: string;
  text: string;
  href: string;
}

export interface MenuBlockProperties {
  items: MenuItem[];
  align: 'left' | 'center' | 'right';
  fontFamily: string;
  fontSize: string;
  color: string;
  padding: string;
  hamburger: boolean;
  iconColor: string;
}

export interface HeroBlockProperties {
  heading: string;
  subtext: string;
  buttonText: string;
  buttonHref: string;
  headingColor: string;
  headingFontSize: string;
  subtextColor: string;
  subtextFontSize: string;
  buttonBackgroundColor: string;
  buttonColor: string;
  buttonBorderRadius: string;
  align: 'left' | 'center' | 'right';
  padding: string;
  backgroundImage: string;
  backgroundColor: string;
}

export type BlockProperties =
  | TextBlockProperties
  | ButtonBlockProperties
  | ImageBlockProperties
  | DividerBlockProperties
  | SpacerBlockProperties
  | SocialBlockProperties
  | HtmlBlockProperties
  | VideoBlockProperties
  | HeadingBlockProperties
  | CountdownBlockProperties
  | MenuBlockProperties
  | HeroBlockProperties;

export interface BlockPropertiesMap {
  text: TextBlockProperties;
  button: ButtonBlockProperties;
  image: ImageBlockProperties;
  divider: DividerBlockProperties;
  spacer: SpacerBlockProperties;
  social: SocialBlockProperties;
  html: HtmlBlockProperties;
  video: VideoBlockProperties;
  heading: HeadingBlockProperties;
  countdown: CountdownBlockProperties;
  menu: MenuBlockProperties;
  hero: HeroBlockProperties;
}

export interface Block<T extends BlockType = BlockType> {
  id: string;
  type: T;
  properties: Record<string, any>;
}

/** A Block with type-safe properties, returned by narrowBlock */
export interface TypedBlock<T extends BlockType> extends Block<T> {
  properties: BlockPropertiesMap[T];
}

/** Narrow a Block to a specific type for type-safe property access */
export function narrowBlock<T extends BlockType>(block: Block, type: T): block is TypedBlock<T> {
  return block.type === type;
}

// ---- Layout ----

export interface Column {
  id: string;
  width: string;
  blocks: Block[];
}

export interface SectionProperties {
  backgroundColor: string;
  padding: string;
  borderRadius: string;
  fullWidth: boolean;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundRepeat?: string;
}

export interface Section {
  id: string;
  columns: Column[];
  properties: SectionProperties;
}

// ---- Template ----

export interface GlobalStyles {
  backgroundColor: string;
  width: number;
  fontFamily: string;
}

export interface HeadMetadata {
  title: string;
  previewText: string;
  headStyles: string[];
}

export interface EmailTemplate {
  sections: Section[];
  globalStyles: GlobalStyles;
  headMetadata?: HeadMetadata;
}

// ---- Variables ----

export interface Variable {
  key: string;
  icon?: string;
  sample?: string;
  label?: string;
  group?: string;
}

export interface VariableChipStyle {
  backgroundColor: string;
  color: string;
  borderColor: string;
  fontSize: string;
  borderRadius: string;
}

// ---- Persistence ----

export interface PersistenceAdapter {
  save(key: string, template: EmailTemplate): void | Promise<void>;
  load(key: string): EmailTemplate | null | Promise<EmailTemplate | null>;
  remove(key: string): void | Promise<void>;
}

// ---- Image Upload ----

export interface UploadOptions {
  context: string;
  blockId: string;
  signal: AbortSignal;
}

export interface UploadResult {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface BrowseResult {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface TransformOptions {
  width: number;
  height?: number;
  fit: string;
  format: string;
  quality: number;
}

export interface ImageUploadAdapter {
  upload: (file: File, opts?: UploadOptions) => Promise<UploadResult>;
  browse?: () => Promise<BrowseResult | null>;
  delete?: (url: string) => Promise<void>;
  validate?: (file: File) => string | null;
  transform?: (url: string, opts: TransformOptions) => string;
}

// ---- Editor ----

export type ActiveTab = 'visual' | 'source' | 'preview';

export interface SelectionState {
  sectionId: string | null;
  columnId: string | null;
  blockId: string | null;
}

export interface EditorState {
  template: EmailTemplate;
  selection: SelectionState;
  activeTab: ActiveTab;
  history: EmailTemplate[];
  historyIndex: number;
  isDirty: boolean;
  blockIndex: Map<string, { sectionId: string; columnId: string }>;
}

// ---- Editor Actions ----

export type EditorAction =
  | { type: 'SET_TEMPLATE'; payload: EmailTemplate }
  | { type: 'ADD_SECTION'; payload: { section: Section; index?: number } }
  | { type: 'REMOVE_SECTION'; payload: { sectionId: string } }
  | { type: 'MOVE_SECTION'; payload: { sectionId: string; toIndex: number } }
  | { type: 'UPDATE_SECTION'; payload: { sectionId: string; properties: Partial<SectionProperties> } }
  | { type: 'ADD_BLOCK'; payload: { sectionId: string; columnId: string; block: Block; index?: number } }
  | { type: 'REMOVE_BLOCK'; payload: { sectionId: string; columnId: string; blockId: string } }
  | { type: 'MOVE_BLOCK'; payload: { fromSectionId: string; fromColumnId: string; blockId: string; toSectionId: string; toColumnId: string; toIndex: number } }
  | { type: 'UPDATE_BLOCK'; payload: { blockId: string; properties: Partial<BlockProperties> } }
  | { type: 'SELECT_BLOCK'; payload: { sectionId: string; columnId: string; blockId: string } | null }
  | { type: 'SELECT_SECTION'; payload: { sectionId: string } | null }
  | { type: 'SET_ACTIVE_TAB'; payload: ActiveTab }
  | { type: 'UPDATE_GLOBAL_STYLES'; payload: Partial<GlobalStyles> }
  | { type: 'UPDATE_HEAD_METADATA'; payload: Partial<HeadMetadata> }
  | { type: 'DUPLICATE_BLOCK'; payload: { sectionId: string; columnId: string; blockId: string } }
  | { type: 'DUPLICATE_SECTION'; payload: { sectionId: string } }
  | { type: 'ADD_BLOCK_AND_SELECT'; payload: { sectionId: string; columnId: string; block: Block; index?: number } }
  | { type: 'ADD_SECTION_WITH_BLOCK'; payload: { section: Section; block: Block; index?: number } }
  | { type: 'DESELECT_ALL' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'PUSH_HISTORY' };

// ---- Props ----

export interface EmailEditorProps {
  initialTemplate?: EmailTemplate;
  initialMJML?: string;
  variables?: Variable[];
  imageUploadAdapter?: ImageUploadAdapter;
  onChange?: (template: EmailTemplate) => void;
  onSave?: (mjml: string, html: string) => void;
  onReady?: () => void;
  /** Called when custom variables are added or removed by the user. Receives all custom variables. */
  onVariablesChange?: (customVariables: Variable[]) => void;
  /** Custom font family options for the rich text toolbar. Falls back to FONT_OPTIONS constant. */
  fontFamilies?: string[];
  /** Custom font size options for the rich text toolbar (e.g. ['12px', '14px', '16px']). Falls back to DEFAULT_FONT_SIZES constant. */
  fontSizes?: string[];
  /** Custom block definitions for the sidebar palette. Override icons, labels, descriptions, or hide specific blocks. Falls back to BLOCK_DEFINITIONS constant. */
  blockDefinitions?: import('./constants').BlockDefinition[];
  /** Key for auto-persisting the template. Different keys allow multiple editor instances to coexist. */
  persistenceKey?: string;
  /** Custom persistence adapter. Defaults to localStorage when persistenceKey is set. */
  persistenceAdapter?: PersistenceAdapter;
  className?: string;
  style?: React.CSSProperties;

  // Event callbacks for host app integration
  /** Called when a block is added to the template */
  onBlockAdd?: (block: Block, sectionId: string, columnId: string) => void;
  /** Called when a block is removed from the template */
  onBlockRemove?: (blockId: string, sectionId: string, columnId: string) => void;
  /** Called when block properties are updated */
  onBlockUpdate?: (blockId: string, properties: Partial<BlockProperties>) => void;
  /** Called when a block is moved to a new position */
  onBlockMove?: (blockId: string, toSectionId: string, toColumnId: string, toIndex: number) => void;
  /** Called when a section is added to the template */
  onSectionAdd?: (section: Section, index?: number) => void;
  /** Called when a section is removed from the template */
  onSectionRemove?: (sectionId: string) => void;
  /** Called when a section is moved to a new position */
  onSectionMove?: (sectionId: string, toIndex: number) => void;
  /** Called when the selection changes */
  onSelectionChange?: (selection: SelectionState) => void;
  /** Called when a template is loaded via SET_TEMPLATE */
  onTemplateLoad?: (template: EmailTemplate) => void;
  /** Called when history state changes (undo/redo) */
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
}

export interface EmailEditorRef {
  getMJML: () => string;
  getHTML: () => Promise<string>;
  getJSON: () => EmailTemplate;
  loadMJML: (source: string) => void;
  loadJSON: (template: EmailTemplate) => void;
  insertBlock: (type: BlockType, sectionIdx?: number) => void;
  getVariables: () => string[];
  undo: () => void;
  redo: () => void;
  reset: () => void;
  exportPDF: () => Promise<void>;
  /** Remove persisted template data for the current persistenceKey. No-op if no key is set. */
  clearPersisted: () => void;
}
