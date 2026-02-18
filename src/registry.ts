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

export function registerBlockRenderer(type: BlockType, component: ComponentType<{ block: Block }>) {
  blockRendererRegistry[type] = component;
}

export function registerBlockProperties(type: BlockType, component: ComponentType<{ block: Block }>) {
  blockPropertiesRegistry[type] = component;
}

export function registerBlockGenerator(type: BlockType, generator: (block: Block, indent: string) => string) {
  blockGeneratorRegistry[type] = generator;
}

export function registerBlockParser(mjmlTag: string, parser: (el: Element) => Block) {
  blockParserRegistry[mjmlTag] = parser;
}
