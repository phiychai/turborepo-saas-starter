/**
 * Component prop interfaces
 * Extracted from Vue component files for better organization and reusability
 */

import type {
  Post,
  FormField,
  PageBlock,
  BlockHero,
  DirectusFile,
  BlockRichtext,
  BlockGallery,
  BlockPricing,
  BlockPost,
  BlockForm,
} from '@turborepo-saas-starter/shared-types/schema';

export interface ButtonProps {
  id: string;
  label?: string | null;
  variant?: string | null;
  url?: string | null;
  type?: 'page' | 'post' | 'url' | 'submit' | null;
  page?: { permalink: string | null };
  post?: { slug: string | null };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: 'arrow' | 'plus' | string;
  customIcon?: string;
  iconPosition?: 'left' | 'right';
  className?: string;
  disabled?: boolean;
  block?: boolean;
  target?: '_blank' | '_self' | '_parent' | '_top';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

// ButtonGroup
export interface ButtonGroupProps {
  buttons: Array<ButtonProps>;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

// Hero
export interface HeroProps {
  data: {
    id: string;
    tagline: string;
    headline: string;
    description: string;
    layout: 'image_image_left' | 'image_center' | 'image_left';
    image: string;
    button_group?: {
      buttons: Array<{
        id: string;
        label: string | null;
        variant: string | null;
        url: string | null;
        type: 'url' | 'page' | 'post';
        pagePermalink?: string | null;
        postSlug?: string | null;
      }>;
    };
  };
}

// Pricing
export interface PricingProps {
  data: {
    id?: string;
    tagline?: string;
    headline?: string;
    pricing_cards: Array<{
      id: string;
      title: string;
      description?: string;
      price?: string;
      badge?: string;
      features?: string[];
      button?: {
        id: string;
        label: string | null;
        variant: string | null;
        url: string | null;
      };
      is_highlighted?: boolean;
    }>;
  };
}

// PricingCard
export interface PricingCardProps {
  card: {
    id: string;
    title: string;
    description?: string;
    price?: string;
    badge?: string;
    features?: string[];
    button?: {
      id: string;
      label: string | null;
      variant: string | null;
      url: string | null;
    };
    is_highlighted?: boolean;
  };
}

// Gallery
export interface GalleryItem {
  id: string;
  directus_file: string;
  sort?: number;
}

export interface GalleryProps {
  data: {
    id: string;
    tagline?: string;
    headline?: string;
    items: GalleryItem[];
  };
}

export interface PostsProps {
  data: {
    id?: string;
    tagline?: string;
    headline?: string;
    posts: Post[];
    limit: number;
  };
}

// RichText
export interface RichTextProps {
  data: {
    id?: string;
    tagline?: string;
    headline?: string;
    content?: string;
    alignment?: 'left' | 'center' | 'right';
    className?: string;
  };
}

export interface CustomForm {
  id: string;
  on_success?: 'redirect' | 'message' | null;
  sort?: number | null;
  submit_label?: string | null;
  success_message?: string | null;
  title?: string | null;
  success_redirect_url?: string | null;
  is_active?: boolean | null;
  fields: FormField[];
}

export interface CustomFormData {
  id: string;
  tagline: string | null;
  headline: string | null;
  form: CustomForm;
}

export type BlockItem =
  | BlockHero
  | BlockRichtext
  | BlockGallery
  | BlockPricing
  | BlockPost
  | BlockForm;

export interface BaseBlockProps {
  block: {
    collection:
      | 'block_hero'
      | 'block_richtext'
      | 'block_gallery'
      | 'block_pricing'
      | 'block_posts'
      | 'block_form';
    item: BlockItem;
    id: string;
  };
}

export interface PageBuilderProps {
  sections: PageBlock[];
}

// Container
export interface ContainerProps {
  as?: 'div' | 'section' | 'main' | 'article' | 'aside' | 'nav' | 'header' | 'footer' | 'form';
  className?: string;
  role?: string;
}

// Headline
export interface HeadlineProps {
  headline?: string | null;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

// Tagline
export interface TaglineProps {
  tagline?: string | null;
  className?: string;
}

export interface DirectusImageProps {
  uuid: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  [key: string]: string | number | boolean | undefined;
}

// Text (Prose)
export interface ProseProps {
  content: string;
  size?: 'sm' | 'md' | 'lg';
  itemId?: string;
  collection?: string;
}

// SearchModel
export type SearchResult = {
  id: string;
  title: string;
  description: string;
  type: string;
  link: string;
  content: string;
};
