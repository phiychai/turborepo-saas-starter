export default defineAppConfig({
  ui: {
    colors: {
      primary: 'amber',
      neutral: 'stone',
    },
    dashboardSidebarToggle: {
      base: '', // Remove 'lg:hidden' to show on all breakpoints
      variants: {
        side: {
          left: '',
          right: '',
        },
      },
    },
    dropdownMenu: {
      slots: {
        item: 'gap-3',
      },
      variants: {
        lg: {
          label: 'p-1.5 text-sm gap-1.5',
          item: 'p-1.5 text-sm gap-3',
          itemLeadingIcon: 'size-6',
          itemLeadingAvatarSize: '2xs',
          itemTrailingIcon: 'size-5',
          itemTrailingKbds: 'gap-0.5',
          itemTrailingKbdsSize: 'md',
        },
      },
    },
    navigationMenu: {
      slots: {
        link: 'gap-4',
        linkLeadingIcon: 'shrink-0 size-6',
      },
    },

    // icon: {
    //   base: 'shrink-0',
    //   size: {
    //     xs: 'size-5',
    //     sm: 'size-5',
    //     md: 'size-8',
    //     lg: 'size-6',
    //     xl: 'size-7',
    //   },
    //   default: {
    //     size: 'lg', // Default size for all icons
    //   },
    // },
    button: {
      variants: {
        size: {
          xs: {
            base: 'px-2 py-1 text-xs gap-1',
            leadingIcon: 'size-4',
            leadingAvatarSize: '3xs',
            trailingIcon: 'size-4',
          },
          sm: {
            base: 'px-3 py-2 text-xs gap-1.5',
            leadingIcon: 'size-5',
            leadingAvatarSize: '3xs',
            trailingIcon: 'size-5',
          },
          md: {
            base: 'px-2.5 py-1.5 text-sm gap-1.5',
            leadingIcon: 'size-6',
            leadingAvatarSize: '2xs',
            trailingIcon: 'size-5',
          },
          lg: {
            base: 'px-3 py-2 text-sm gap-2',
            leadingIcon: 'size-5',
            leadingAvatarSize: '2xs',
            trailingIcon: 'size-5',
          },
          xl: {
            base: 'px-3 py-2 text-base gap-2',
            leadingIcon: 'size-6',
            leadingAvatarSize: 'xs',
            trailingIcon: 'size-6',
          },
        },
        block: {
          true: {
            base: 'w-full justify-center',
            trailingIcon: 'ms-auto',
          },
        },
        square: {
          true: '',
        },
        leading: {
          true: '',
        },
        trailing: {
          true: '',
        },
        loading: {
          true: '',
        },
        active: {
          true: {
            base: '',
          },
          false: {
            base: '',
          },
        },
      },
      defaultVariants: {
        color: 'primary',
        variant: 'solid',
        size: 'md',
      },
    },
    blogPosts: {
      base: 'flex flex-col gap-8 lg:gap-y-16 pt-0',
    },
    prose: {
      h1: {
        slots: {
          base: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl font-sans',
        },
      },
      p: {
        base: 'leading-8 [&:not(:first-child)]:mt-6 lg:text-xl',
      },
    },
  },
});
