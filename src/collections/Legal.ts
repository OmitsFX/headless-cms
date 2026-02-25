import type { CollectionConfig } from "payload"
import { slugField } from "@/fields/slug"
import { triggerRebuild, triggerRebuildOnDelete } from "@/hooks/triggerRebuild"

export const Legal: CollectionConfig = {
	slug: "legal",
	admin: {
		useAsTitle: 'title',
		defaultColumns: ['title', 'slug', 'status', 'lastUpdated'],
    description: 'Legal pages like Privacy Policy, Terms of Service, etc.',
		group: 'Website',
	},
	versions: {
		drafts: {
			autosave: false,
			validate: false
		},
	},
	access: {
		read: ({ req: { user } }) => {
      // Public can only see published posts
      if (!user) {
        return {
          _status: { equals: 'published' },
        }
      }
      // Authenticated users (admins) can see all posts
      return true
    },
    // Admins and Editors can create posts
    create: ({ req: { user } }) => {
      if (!user) return false
      return (
        user?.roles === 'admin' || 
        user?.roles === 'editor'
      )
    },
    
    update: ({ req: { user } }) => {
      if (!user) return false
      return (
        user?.roles === 'admin' || 
        user?.roles === 'editor'
      )
    },
    
    delete: ({ req: { user } }) => {
      return( 
        user?.roles === 'admin' ||
        user?.roles === 'editor'
      )
    },
    
    admin: ({ req: { user } }) => {
      if (!user) return false
      return (
        user?.roles === 'admin' || 
        user?.roles === 'editor' || 
        user?.roles === 'viewer'
      )
    },
	},
	hooks: {
    afterChange: [triggerRebuild],
    afterDelete: [triggerRebuildOnDelete],
	},
	fields: [
		{
			name: 'title',
			type: 'text',
			required: true,
			localized: true,
			admin: {
        description: 'Page title (e.g., "Privacy Policy")',
      },
		},
		{
			name: 'description',
			type: 'textarea',
			required: true,
			maxLength: 160,
			localized: true,
			admin: {
				description: 'Short description for SEO and preview cards',
			},
		},
		...slugField('title'),
		{
			name: 'body',
			type: 'richText',
			required: true,
			localized: true,
			admin: {
        description: 'Legal page content',
      },
		},
		{
			name: 'lastUpdated',
			type: 'date',
			required: true,
			admin: {
				position: 'sidebar',
				date: {
					pickerAppearance: 'dayOnly',
				},
				description: 'Date this policy was last updated (set manually)',
			},
		},
		{
			name: 'previousPublicationDate',
			type: 'date',
			admin: {
				position: 'sidebar',
				description: 'Previous publication date (auto-tracked)',
				readOnly: true,
			},
			hooks: {
				beforeChange: [
					({ siblingData, value, originalDoc }) => {
						// On first publish, set to current date
            if (!originalDoc && siblingData._status === 'published') {
              return new Date().toISOString()
            }

						// If status changed from draft to published, update previous date
            if (
              originalDoc?._status !== 'published' &&
              siblingData._status === 'published'
            ) {
              return new Date().toISOString()
            }

						// If already published and being updated, keep the previous date
            if (originalDoc?._status === 'published' && siblingData._status === 'published') {
              return originalDoc.previousPublicationDate || value
            }

            // Otherwise keep existing value
            return value
					}
				]
			},
		}
	],
	timestamps: true,
}
