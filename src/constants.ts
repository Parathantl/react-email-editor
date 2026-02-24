import type {
  BlockType,
  BlockPropertiesMap,
  TextBlockProperties,
  ButtonBlockProperties,
  ImageBlockProperties,
  DividerBlockProperties,
  SpacerBlockProperties,
  SocialBlockProperties,
  HtmlBlockProperties,
  VideoBlockProperties,
  HeadingBlockProperties,
  CountdownBlockProperties,
  MenuBlockProperties,
  HeroBlockProperties,
  SectionProperties,
  GlobalStyles,
  VariableChipStyle,
  HeadMetadata,
} from './types';

// ---- Default Block Properties ----

export const DEFAULT_TEXT_PROPERTIES: TextBlockProperties = {
  content: '',
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
  color: '#000000',
  lineHeight: '1.5',
  padding: '10px 25px',
  align: 'left',
  fontWeight: 'normal',
  textTransform: 'none',
  letterSpacing: 'normal',
};

export const DEFAULT_BUTTON_PROPERTIES: ButtonBlockProperties = {
  text: 'Click me',
  href: '#',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
  borderRadius: '4px',
  padding: '10px 25px',
  innerPadding: '12px 24px',
  align: 'center',
  width: 'auto',
  fontWeight: 'normal',
  textTransform: 'none',
  letterSpacing: 'normal',
};

export const DEFAULT_IMAGE_PROPERTIES: ImageBlockProperties = {
  src: '',
  alt: '',
  href: '',
  width: '600px',
  height: 'auto',
  padding: '10px 25px',
  align: 'center',
  fluidOnMobile: true,
};

export const DEFAULT_DIVIDER_PROPERTIES: DividerBlockProperties = {
  borderColor: '#cccccc',
  borderWidth: '1px',
  borderStyle: 'solid',
  padding: '10px 25px',
  width: '100%',
};

export const DEFAULT_SPACER_PROPERTIES: SpacerBlockProperties = {
  height: '20px',
};

export const DEFAULT_SOCIAL_PROPERTIES: SocialBlockProperties = {
  elements: [
    { name: 'facebook', href: 'https://facebook.com' },
    { name: 'twitter', href: 'https://twitter.com' },
    { name: 'instagram', href: 'https://instagram.com' },
  ],
  mode: 'horizontal',
  align: 'center',
  iconSize: '20px',
  iconPadding: '5px',
  padding: '10px 25px',
  fontSize: '13px',
  color: '#333333',
  borderRadius: '3px',
};

export const DEFAULT_HTML_PROPERTIES: HtmlBlockProperties = {
  content: '',
  padding: '10px 25px',
};

export const DEFAULT_VIDEO_PROPERTIES: VideoBlockProperties = {
  src: '',
  thumbnailUrl: '',
  alt: 'Video',
  padding: '10px 25px',
  align: 'center',
};

export const DEFAULT_HEADING_PROPERTIES: HeadingBlockProperties = {
  content: '',
  level: 'h2',
  fontFamily: 'Arial, sans-serif',
  fontSize: '28px',
  color: '#000000',
  lineHeight: '1.5',
  fontWeight: 'bold',
  padding: '10px 25px',
  align: 'left',
  textTransform: 'none',
  letterSpacing: 'normal',
};

export const DEFAULT_COUNTDOWN_PROPERTIES: CountdownBlockProperties = {
  targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  label: 'Sale ends in',
  digitBackgroundColor: '#333333',
  digitColor: '#ffffff',
  labelColor: '#666666',
  fontSize: '24px',
  padding: '10px 25px',
  align: 'center',
};

export const DEFAULT_MENU_PROPERTIES: MenuBlockProperties = {
  items: [
    { text: 'Home', href: '#' },
    { text: 'About', href: '#' },
    { text: 'Contact', href: '#' },
  ],
  align: 'center',
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
  color: '#333333',
  padding: '10px 25px',
  hamburger: false,
  iconColor: '#333333',
};

export const DEFAULT_HERO_PROPERTIES: HeroBlockProperties = {
  heading: 'Welcome to Our Newsletter',
  subtext: 'Stay up to date with our latest news and updates.',
  buttonText: 'Get Started',
  buttonHref: '#',
  headingColor: '#333333',
  headingFontSize: '32px',
  subtextColor: '#666666',
  subtextFontSize: '16px',
  buttonBackgroundColor: '#2563eb',
  buttonColor: '#ffffff',
  buttonBorderRadius: '4px',
  align: 'center',
  padding: '40px 25px',
  backgroundImage: '',
  backgroundColor: '#ffffff',
};

export const DEFAULT_BLOCK_PROPERTIES: { [K in BlockType]: BlockPropertiesMap[K] } = {
  text: DEFAULT_TEXT_PROPERTIES,
  button: DEFAULT_BUTTON_PROPERTIES,
  image: DEFAULT_IMAGE_PROPERTIES,
  divider: DEFAULT_DIVIDER_PROPERTIES,
  spacer: DEFAULT_SPACER_PROPERTIES,
  social: DEFAULT_SOCIAL_PROPERTIES,
  html: DEFAULT_HTML_PROPERTIES,
  video: DEFAULT_VIDEO_PROPERTIES,
  heading: DEFAULT_HEADING_PROPERTIES,
  countdown: DEFAULT_COUNTDOWN_PROPERTIES,
  menu: DEFAULT_MENU_PROPERTIES,
  hero: DEFAULT_HERO_PROPERTIES,
};

// ---- Default Section Properties ----

export const DEFAULT_SECTION_PROPERTIES: SectionProperties = {
  backgroundColor: 'transparent',
  padding: '20px 0',
  borderRadius: '0px',
  fullWidth: false,
};

// ---- Default Head Metadata ----

export const DEFAULT_HEAD_METADATA: HeadMetadata = {
  title: '',
  previewText: '',
  headStyles: [],
};

// ---- Default Global Styles ----

export const DEFAULT_GLOBAL_STYLES: GlobalStyles = {
  backgroundColor: '#f4f4f4',
  width: 600,
  fontFamily: 'Arial, sans-serif',
};

// ---- Default Variable Chip Style ----

export const DEFAULT_VARIABLE_CHIP_STYLE: VariableChipStyle = {
  backgroundColor: '#dbeafe',
  color: '#1e40af',
  borderColor: '#93c5fd',
  fontSize: 'inherit',
  borderRadius: '10px',
};

// ---- Block Palette Definitions ----

export interface BlockDefinition {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: 'text',
    label: 'Text',
    icon: '📝',
    description: 'Rich text content with formatting',
  },
  {
    type: 'heading',
    label: 'Heading',
    icon: 'H',
    description: 'Heading with level selector',
  },
  {
    type: 'button',
    label: 'Button',
    icon: '🔘',
    description: 'Call-to-action button',
  },
  {
    type: 'image',
    label: 'Image',
    icon: '🖼️',
    description: 'Image with optional link',
  },
  {
    type: 'video',
    label: 'Video',
    icon: '▶️',
    description: 'Video thumbnail with link',
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: '➖',
    description: 'Horizontal divider line',
  },
  {
    type: 'spacer',
    label: 'Spacer',
    icon: '↕️',
    description: 'Vertical spacing',
  },
  {
    type: 'social',
    label: 'Social',
    icon: '👥',
    description: 'Social media links',
  },
  {
    type: 'html',
    label: 'HTML',
    icon: '</>',
    description: 'Raw HTML content',
  },
  {
    type: 'countdown',
    label: 'Countdown',
    icon: '⏱️',
    description: 'Countdown timer with digit boxes',
  },
  {
    type: 'menu',
    label: 'Menu',
    icon: '☰',
    description: 'Navigation menu links',
  },
  {
    type: 'hero',
    label: 'Hero',
    icon: '🦸',
    description: 'Hero section with heading, text and CTA',
  },
];

// ---- History ----

export const MAX_HISTORY_SIZE = 50;

// ---- Font Size Options ----

export const DEFAULT_FONT_SIZES = [
  '10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px',
];

// ---- Font Options ----

export const FONT_OPTIONS = [
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Courier New, monospace',
  'Verdana, sans-serif',
  'Trebuchet MS, sans-serif',
  'Tahoma, sans-serif',
];

// ---- Color Presets ----

export const COLOR_PRESETS = [
  '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f43f5e', '#6366f1', '#0ea5e9', '#84cc16',
];

// ---- Layout Presets ----

export const COLUMN_LAYOUTS = [
  { label: '1 Column', widths: ['100%'] },
  { label: '2 Columns', widths: ['50%', '50%'] },
  { label: '3 Columns', widths: ['33.33%', '33.33%', '33.33%'] },
  { label: '1/3 + 2/3', widths: ['33.33%', '66.67%'] },
  { label: '2/3 + 1/3', widths: ['66.67%', '33.33%'] },
];
