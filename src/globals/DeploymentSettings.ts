import type { GlobalConfig } from 'payload'
import { DEPLOYMENT_COLLECTION_OPTIONS } from '@/constants/deploymentCollections'

export const DeploymentSettings: GlobalConfig = {
  slug: 'deployment-settings',
  label: 'Deployment Settings',
  admin: {
    group: 'Admin',
    description: 'Configure which content changes trigger website deployments',
  },
  access: {
    // Only admins can read/update
    read: ({ req: { user } }) => user?.roles === 'admin',
    update: ({ req: { user } }) => user?.roles === 'admin',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Trigger Settings',
          fields: [
            {
              name: 'enabledCollections',
              type: 'select',
              label: 'Collections that Trigger Deployments',
              hasMany: true,
              options: [...DEPLOYMENT_COLLECTION_OPTIONS],
              defaultValue: [],
              admin: {
                description:
                  'Select which collections should trigger a website rebuild when published/updated/deleted',
                isClearable: true,
              },
            },
            {
              name: 'deployOnPublish',
              type: 'checkbox',
              label: 'Deploy when content is published',
              defaultValue: true,
              admin: {
                description: 'Trigger deployment when content status changes to "published"',
              },
            },
            {
              name: 'deployOnUpdate',
              type: 'checkbox',
              label: 'Deploy when published content is updated',
              defaultValue: true,
              admin: {
                description: 'Trigger deployment when already-published content is modified',
              },
            },
            {
              name: 'deployOnDelete',
              type: 'checkbox',
              label: 'Deploy when published content is deleted',
              defaultValue: true,
              admin: {
                description: 'Trigger deployment when published content is removed',
              },
            },
          ],
        },
        {
          label: 'Webhook Configuration',
          fields: [
            {
              name: 'deployHookUrl',
              type: 'text',
              label: 'Cloudflare Deploy Hook URL',
              admin: {
                description:
                  'Your Cloudflare Pages deploy hook URL. Leave empty to use environment variable.',
                placeholder: 'https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/...',
              },
            },
            {
              name: 'enableLogging',
              type: 'checkbox',
              label: 'Enable Deployment Logging',
              defaultValue: true,
              admin: {
                description: 'Log all deployment triggers to the deployment-logs collection',
              },
            },
          ],
        },
      ],
    },
  ],
}
