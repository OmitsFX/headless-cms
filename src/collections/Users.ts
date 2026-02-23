import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'roles'],
    group: 'Admin',
  },
  access: {
    // Only admins can create users
    create: ({ req: { user } }) => user?.roles?.includes('admin') || false,
    
    // Everyone can read their own profile, admins can read all
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      // Users can only see themselves
      return {
        id: { equals: user.id },
      }
    },
    
    // Users can update themselves, admins can update anyone
    update: ({ req: { user }, id }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      return user.id === id
    },
    
    // Only admins can delete users
    delete: ({ req: { user } }) => user?.roles?.includes('admin') || false,
    
    // Admins see the collection in sidebar
    admin: ({ req: { user } }) => user?.roles?.includes('admin') || false,
  },
  auth: true,
  fields: [
    // Email added by default
    // Add more fields as needed
    {
      name: 'name',
      type: 'text',
      required: true,
      defaultValue: "Osaro Adade",
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: false,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Viewer', value: 'viewer' },
      ],
      defaultValue: 'admin',
      required: true,
      saveToJWT: true, // Include in JWT for fast access checks
      access: {
        // Only admins can see roles
        read: ({ req: { user } }) => user?.roles?.includes('admin') || false,
        // Only admins can update roles
        update: ({ req: { user } }) => user?.roles?.includes('admin') || false,
      },
      admin: {
        description: 'Admin: Full access | Editor: Posts & Media | Viewer: Read-only',
      },
    },
  ],
}
