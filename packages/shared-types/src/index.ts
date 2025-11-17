// Re-export schema types
export type { DirectusFile, DirectusUser, Page, PageBlock, Post } from './schema';

// Re-export billing types
export type { Plan, Subscription, Invoice } from './billing';

// Re-export user types
export type { UserProfile } from './user';

// User-related types
export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark';
  notifications: 'all' | 'important' | 'none';
  language: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

// Content-related types
export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  duration: number;
  category: string;
  tags: string[];
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  category: string;
  tags: string[];
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Workspace-related types
export interface Workspace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Widget {
  id: string;
  type: 'note' | 'video' | 'article' | 'research' | 'todo';
  workspaceId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
