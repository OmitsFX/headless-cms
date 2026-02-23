import fs from 'fs'
import path from 'path'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import { GetPlatformProxyOptions } from 'wrangler'
import { r2Storage } from '@payloadcms/storage-r2'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { GenerateTitle, GenerateURL, GenerateDescription, GenerateImage } from '@payloadcms/plugin-seo/types'
import { Post } from './payload-types'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { DeploymentLogs } from './collections/DeploymentLogs'

import { resendAdapter } from '@payloadcms/email-resend'

import localization from './i18n/localization'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const generateTitle: GenerateTitle<Post> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Omits Blog` : 'Omits Blog'
}

const generateURL: GenerateURL<Post> = ({ doc, locale }) => {
  const slug = doc?.slug
  const lang = locale || 'en'
  return slug
    ? `${process.env.NEXT_PUBLIC_SERVER_URL!}/${lang}/blog/${slug}`
    : `${process.env.NEXT_PUBLIC_SERVER_URL!}/${lang}/blog`
}

const generateDescription: GenerateDescription<Post> = ({ doc }) => {
  return doc?.description || ''
}

const generateImage: GenerateImage<Post> = ({ doc }) => {
  return doc?.featuredImage || ''
}

const realpath = (value: string) => (fs.existsSync(value) ? fs.realpathSync(value) : undefined)

const isCLI = process.argv.some((value) => realpath(value).endsWith(path.join('payload', 'bin.js')))
const isProduction = process.env.NODE_ENV === 'production'

const cloudflare =
  isCLI || !isProduction
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      views: {
        deploymentLogs: {
          Component: '/components/DeploymentLogsView',
          path: '/deployment-logs',
        },
      },
    },
  },
  collections: [Users, Media, Posts, DeploymentLogs],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  localization,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({ binding: cloudflare.env.D1 }),
  graphQL: {
    disable: true,
  },
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
    seoPlugin({
      collections: ['posts'],
      uploadsCollection: 'media',
      generateTitle,
      generateURL,
      generateDescription,
      generateImage,
    })
  ],
  email: resendAdapter({
    defaultFromAddress: 'noreply@m.myomits.com',
    defaultFromName: 'Omits CMS',
    apiKey: process.env.RESEND_API_KEY || ''
  })
})

// Adapted from https://github.com/opennextjs/opennextjs-cloudflare/blob/d00b3a13e42e65aad76fba41774815726422cc39/packages/cloudflare/src/api/cloudflare-context.ts#L328C36-L328C46
function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings: isProduction,
      } satisfies GetPlatformProxyOptions),
  )
}
