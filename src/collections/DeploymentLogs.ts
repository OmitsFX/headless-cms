// src/collections/DeploymentLogs.ts

import type { CollectionConfig } from 'payload'

export const DeploymentLogs: CollectionConfig = {
  slug: 'deployment-logs',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['createdAt', 'status', 'trigger', 'resourceType', 'resourceSlug'],
    description: 'Track all website rebuild deployments',
    group: 'Admin',
  },
  access: {
    // Only admins can read deployment logs
    read: ({ req: { user } }) => user?.roles === 'admin' || false,
    
    // Prevent manual creation/editing (only created by hooks)
    create: () => false,
    update: () => false,
    
    // Only admins can delete
    delete: ({ req: { user } }) => user?.roles === 'admin' || false,
    
    // Only admins see this collection in sidebar
    admin: ({ req: { user } }) => user?.roles === 'admin' || false,
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Success', value: 'success' },
        { label: 'Failed', value: 'failed' },
        { label: 'Pending', value: 'pending' },
      ],
      admin: {
        description: 'Deployment status',
      },
    },
    {
      name: 'trigger',
      type: 'select',
      required: true,
      options: [
        { label: 'Post Published', value: 'post-published' },
        { label: 'Post Updated', value: 'post-updated' },
        { label: 'Post Deleted', value: 'post-deleted' },
        { label: 'Legal Published', value: 'legal-published' },
        { label: 'Legal Updated', value: 'legal-updated' },
        { label: 'Legal Deleted', value: 'legal-deleted' },
        { label: 'Manual Trigger', value: 'manual' },
      ],
      admin: {
        description: 'What triggered the deployment',
      },
    },
    {
      name: 'resourceType',
      type: 'select',
      options: [
        { label: 'Post', value: 'posts' },
        { label: 'Legal', value: 'legal' },
      ],
      admin: {
        description: 'Collection that triggered the deployment',
      },
    },
    {
      name: 'resourceSlug',
      type: 'text',
      admin: {
        description: 'Slug of the resource that triggered the deployment',
      },
    },
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      label: 'Post Resource',
      admin: {
        description: 'Post resource that triggered the deployment (posts only)',
      },
    },
    {
      name: 'postSlug',
      type: 'text',
      label: 'Post Slug (legacy)',
      admin: {
        description: 'Legacy post slug field for older records',
      },
    },
    {
      name: 'buildId',
      type: 'text',
      admin: {
        description: 'Cloudflare build ID',
      },
    },
    {
      name: 'responseStatus',
      type: 'number',
      admin: {
        description: 'HTTP response status code',
      },
    },
    {
      name: 'errorMessage',
      type: 'textarea',
      admin: {
        description: 'Error message if deployment failed',
        condition: (data) => data.status === 'failed',
      },
    },
    {
      name: 'cloudflareResponse',
      type: 'json',
      admin: {
        description: 'Full response from Cloudflare',
      },
    },
  ],
  timestamps: true,
}
