import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
  },
  access: {
    read: () => true,

    // Admins and Editors can upload media
    create: ({ req: { user } }) => {
      if (!user) return false
      return (
        user?.roles === 'admin' || 
        user?.roles === 'editor'
      )
    },
    
    // Admins and Editors can update media
    update: ({ req: { user } }) => {
      if (!user) return false
      return (
        user?.roles === 'admin' || 
        user?.roles === 'editor'
      )
    },
    
    // Admins and Editors can delete media
    delete: ({ req: { user } }) => {
      return (
        user?.roles === 'admin' ||
        user?.roles === 'editor'
      )
    },
    
    // Editors and Admins see media in sidebar
    admin: ({ req: { user } }) => {
      if (!user) return false
      return (
        user?.roles === 'admin' || 
        user?.roles === 'editor' || 
        user?.roles === 'viewer'
      )
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Alt text for accessibility and SEO',
      },
    },
  ],
  upload: {
    // These are not supported on Workers yet due to lack of sharp
    crop: false,
    focalPoint: false,
  },
}
