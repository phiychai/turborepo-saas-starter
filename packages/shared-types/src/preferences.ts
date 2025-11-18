/**
 * User Preferences Type
 * Defines the structure of user preferences stored in the database
 */
export interface UserPreferences {
  emailNotifications?: boolean;
  marketingEmails?: boolean;
  language?: string;
  timezone?: string;
  theme?: 'light' | 'dark' | 'system';
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Command Palette Settings
 * Settings for the Directus Command Palette Module
 */
export interface CommandPaletteCollection {
  collection: string;
  displayTemplate: string;
  descriptionField: string | null;
  fields: string[];
  limit: number;
  availableGlobally: boolean;
}

export interface CommandPaletteSettings {
  searchMode?: 'as_you_type' | 'on_enter';
  collections?: CommandPaletteCollection[];
  triggerRate?: number;
  commandPaletteEnabled?: boolean;
  [key: string]: string | number | boolean | CommandPaletteCollection[] | undefined;
}

/**
 * Auth Sync Error Payload
 * Payload structure for authentication sync errors
 * This is a flexible type that can contain various error-related data
 */
export type AuthSyncErrorPayload = Record<
  string,
  string | number | boolean | null | undefined | AuthSyncErrorPayload | AuthSyncErrorPayload[]
>;

/**
 * Widget Data
 * Data structure for workspace widgets
 */
export interface WidgetData {
  [key: string]: string | number | boolean | null | undefined | WidgetData | WidgetData[];
}

