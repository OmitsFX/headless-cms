import type { CollectionConfig } from 'payload'
import { slugField } from '@/fields/slug'
import { triggerRebuild, triggerRebuildOnDelete } from '@/hooks/triggerRebuild'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'publishedDate', 'status'],
    group: 'Content',
  },
  access: {
    read: ({ req: { user } }) => {
      // Public can only see published posts
      if (!user) {
        return {
          status: { equals: 'published' },
        }
      }
      // Authenticated users (admins) can see all posts
      return true
    },
    // Admins and Editors can create posts
    create: ({ req: { user } }) => {
      if (!user) return false
      return (
        user?.roles?.includes('admin') || 
        user?.roles?.includes('editor')
      )
    },
    
    // Admins and Editors can update posts
    update: ({ req: { user } }) => {
      if (!user) return false
      return (
        user?.roles?.includes('admin') || 
        user?.roles?.includes('editor')
      )
    },
    
    // Admins and Editors can delete posts
    delete: ({ req: { user } }) => {
      return user?.roles?.includes('admin') ||
      user?.roles?.includes('editor')
    },
    
    // Editors and Admins see posts in sidebar
    admin: ({ req: { user } }) => {
      if (!user) return false
      return (
        user?.roles?.includes('admin') || 
        user?.roles?.includes('editor') || 
        user?.roles?.includes('viewer')
      )
    },
  },
  hooks: {
    // Trigger SSG rebuild after post is created/updated
    afterChange: [triggerRebuild],
    
    // Trigger SSG rebuild after post is deleted
    afterDelete: [triggerRebuildOnDelete],

  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Thumbnail image for blog post preview cards',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      localized: true,
      admin: {
        description: 'Short description for SEO and preview cards',
      },
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
      localized: true,
    },
    {
      name: 'publishedDate',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: {
        position: 'sidebar',
      }
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Check to feature this post on the blog home page'
      },
      validate: async (value, { req: { payload }, id }) => {
        if (value === true) {
          const { totalDocs } = await payload.find({
            collection: 'posts',
            where: {
              featured: { equals: true },
              ...(id ? { id: { not_equals: id } } : {}),
            },
            limit: 1,
          })
          
          if (totalDocs >= 3) {
            return 'You can only have a maximum of 3 featured posts at a time.'
          }
        }
        return true
      },
    },
    ...slugField(),
  ],
}