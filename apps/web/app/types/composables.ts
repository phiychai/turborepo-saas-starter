/**
 * Composable-related types
 * Extracted from composable files for better organization
 */

import type { PrimaryKey } from '@directus/types';

// useVisualEditing
export interface ApplyOptions {
  directusUrl: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements?: any;
  onSaved?: (data: {
    collection?: string;
    item?: PrimaryKey | null;
    payload?: Record<string, unknown>;
  }) => void;
  customClass?: string;
}

// useTableOfContents
export interface TocLink {
  id: string;
  text: string;
  depth: number;
  children?: TocLink[];
}

