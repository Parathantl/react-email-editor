/**
 * Block type registries — single source of truth for mapping block types
 * to their renderers, property panels, generators, and parsers.
 *
 * Adding a new block type requires only adding entries here (Open/Closed Principle).
 */
import type { ComponentType } from 'react';
import type { Block, BlockType } from './types';

// ---- Component Registries (populated by components at import time) ----

export const blockRendererRegistry: Record<string, ComponentType<{ block: Block }>> = {};
export const blockPropertiesRegistry: Record<string, ComponentType<{ block: Block }>> = {};

// ---- MJML Generator Registry ----

export const blockGeneratorRegistry: Record<string, (block: Block, indent: string) => string> = {};

// ---- MJML Parser Registry ----

export const blockParserRegistry: Record<string, (el: Element) => Block> = {};

// ---- Registration helpers ----

/**
 * Register a block renderer. Accepts BlockType for built-in types, or any string for custom blocks.
 */
export function registerBlockRenderer(type: BlockType | (string & {}), component: ComponentType<{ block: Block }>) {
  blockRendererRegistry[type] = component;
}

/**
 * Register a block properties panel. Accepts BlockType for built-in types, or any string for custom blocks.
 */
export function registerBlockProperties(type: BlockType | (string & {}), component: ComponentType<{ block: Block }>) {
  blockPropertiesRegistry[type] = component;
}

/**
 * Register a MJML generator. Accepts BlockType for built-in types, or any string for custom blocks.
 */
export function registerBlockGenerator(type: BlockType | (string & {}), generator: (block: Block, indent: string) => string) {
  blockGeneratorRegistry[type] = generator;
}

export function registerBlockParser(mjmlTag: string, parser: (el: Element) => Block) {
  blockParserRegistry[mjmlTag] = parser;
}

/** Returns set of all registered block types (built-in + custom). */
export function getRegisteredBlockTypes(): Set<string> {
  return new Set(Object.keys(blockRendererRegistry));
}
