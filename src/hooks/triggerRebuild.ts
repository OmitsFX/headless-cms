// src/hooks/triggerRebuild.ts

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { isDeployableCollectionSlug } from '@/constants/deploymentCollections'

// Type for Cloudflare deploy hook response
interface CloudflareDeployResponse {
  result?: {
    id?: string
    url?: string
    created_on?: string
    [key: string]: unknown
  }
  success?: boolean
  errors?: unknown[]
  messages?: unknown[]
  [key: string]: unknown
}

// Match the exact types from DeploymentLogs collection
type DeploymentTrigger =
  | 'post-published'
  | 'post-updated'
  | 'post-deleted'
  | 'legal-published'
  | 'legal-updated'
  | 'legal-deleted'
  | 'manual'
type DeploymentStatus = 'success' | 'failed' | 'pending'

const getDeploymentTrigger = ({
  collectionSlug,
  operationType,
}: {
  collectionSlug: string
  operationType: 'published' | 'updated' | 'deleted'
}): DeploymentTrigger | 'legal-published' | 'legal-updated' | 'legal-deleted' => {
  const prefix = collectionSlug === 'legal' ? 'legal' : 'post'
  return `${prefix}-${operationType}` as DeploymentTrigger
}

/**
 * Trigger full static site rebuild via Cloudflare Pages deploy hook
 * Checks deployment settings global to see if collection is enabled
 * Maintains true SSG architecture - all pages pre-built at deploy time
 * Logs all deployments to the deployment-logs collection
 */
export const triggerRebuild: CollectionAfterChangeHook = async ({
  doc,
  req,
  previousDoc,
  operation,
  collection,
}) => {
  const { payload } = req

  // Check deployment settings to see if this collection should trigger deployments
  try {
    const settings = await payload.findGlobal({
      slug: 'deployment-settings',
      depth: 0,
    })

    // Check if this collection is enabled for deployments
    const enabledCollections = (settings.enabledCollections ?? []).filter(isDeployableCollectionSlug)
    if (!isDeployableCollectionSlug(collection.slug)) {
      payload.logger.info(
        `Skipped rebuild - "${collection.slug}" is not a deployable collection`,
      )
      return doc
    }

    if (!enabledCollections.includes(collection.slug)) {
      payload.logger.info(
        `Skipped rebuild - "${collection.slug}" not enabled in deployment settings`,
      )
      return doc
    }

    // Only trigger rebuild if status is published or was published
    const isPublished = (doc as any)._status === 'published'
    const wasPublished = (previousDoc as any)?._status === 'published'
    const isNewlyPublished = !previousDoc && isPublished
    const isPublishingExisting = (previousDoc as any)?._status !== 'published' && isPublished
    const isUpdatingPublished = wasPublished && isPublished

    // Check if this type of operation should trigger deployment
    if (isNewlyPublished || isPublishingExisting) {
      if (!settings.deployOnPublish) {
        payload.logger.info('Skipped rebuild - deployOnPublish is disabled')
        return doc
      }
    } else if (isUpdatingPublished) {
      if (!settings.deployOnUpdate) {
        payload.logger.info('Skipped rebuild - deployOnUpdate is disabled')
        return doc
      }
    } else {
      // Draft saved, no rebuild needed
      payload.logger.info(`Skipped rebuild for draft ${collection.slug}: ${(doc as any).slug}`)
      return doc
    }
  } catch (err) {
    payload.logger.error('Failed to fetch deployment settings, skipping deployment')
    return doc
  }

  // Determine trigger type
  let trigger: DeploymentTrigger
  if (!previousDoc) {
    trigger = getDeploymentTrigger({ collectionSlug: collection.slug, operationType: 'published' })
  } else if ((previousDoc as any)._status !== 'published' && (doc as any)._status === 'published') {
    trigger = getDeploymentTrigger({ collectionSlug: collection.slug, operationType: 'published' })
  } else if ((previousDoc as any)._status === 'published' && (doc as any)._status !== 'published') {
    trigger = getDeploymentTrigger({ collectionSlug: collection.slug, operationType: 'updated' }) // Unpublishing
  } else if ((previousDoc as any)._status === 'published' && (doc as any)._status === 'published') {
    trigger = getDeploymentTrigger({ collectionSlug: collection.slug, operationType: 'updated' })
  } else {
    trigger = getDeploymentTrigger({ collectionSlug: collection.slug, operationType: 'updated' })
  }

  const deployHook = process.env.CLOUDFLARE_DEPLOY_HOOK

  if (!deployHook) {
    payload.logger.warn('CLOUDFLARE_DEPLOY_HOOK not set - skipping rebuild')

    // Log the failed attempt
    try {
      await payload.create({
        collection: 'deployment-logs',
        data: {
          status: 'failed' as DeploymentStatus,
          trigger,
          resourceType: collection.slug,
          resourceSlug: (doc as any).slug as string,
          ...(collection.slug === 'posts' ? { post: doc.id } : {}),
          postSlug: (doc as any).slug as string,
          errorMessage: 'CLOUDFLARE_DEPLOY_HOOK environment variable not set',
        },
        req,
        overrideAccess: true,
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      payload.logger.error(`Failed to log deployment error: ${errorMsg}`)
    }

    return doc
  }

  // Log rebuild trigger
  const statusChange = (previousDoc as any)?._status
    ? `${(previousDoc as any)._status} → ${(doc as any)._status}`
    : (doc as any)._status

  payload.logger.info(`Triggering rebuild for ${collection.slug}: "${(doc as any).slug}"`)
  payload.logger.info(`Operation: ${operation}, Status: ${statusChange}`)

  try {
    // Trigger Cloudflare Pages deploy
    const response = await fetch(deployHook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const responseStatus = response.status

    if (response.ok) {
      payload.logger.info(`Rebuild triggered successfully`)

      // Parse Cloudflare response
      let cloudflareData: CloudflareDeployResponse = {}
      let buildId: string | undefined

      try {
        cloudflareData = (await response.json()) as CloudflareDeployResponse
        buildId = cloudflareData.result?.id

        if (buildId) {
          payload.logger.info(`Build ID: ${buildId}`)
        }
      } catch {
        // Response might not be JSON, that's okay
      }

      payload.logger.info(`Your site will update in ~2-5 minutes`)

      // Log successful deployment
      try {
        payload.logger.info('🔍 About to create deployment log...')
        
        await payload.create({
          collection: 'deployment-logs',
          data: {
            status: 'success' as DeploymentStatus,
            trigger,
            resourceType: collection.slug,
            resourceSlug: (doc as any).slug as string,
            ...(collection.slug === 'posts' ? { post: doc.id } : {}),
            postSlug: (doc as any).slug as string,
            buildId,
            responseStatus,
            cloudflareResponse: cloudflareData,
          },
          req,
          overrideAccess: true,
        })
        
        payload.logger.info('✅ Deployment log created successfully')
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        payload.logger.error(`❌ Failed to log deployment: ${errorMsg}`)
        payload.logger.error(`❌ Full error: ${String(err)}`)
      }
    } else {
      // Failed to trigger rebuild
      const errorText = await response.text()

      payload.logger.error(`Failed to trigger rebuild`)
      payload.logger.error(`Status: ${responseStatus} ${response.statusText}`)

      // Log failed deployment
      try {
        await payload.create({
          collection: 'deployment-logs',
          data: {
            status: 'failed' as DeploymentStatus,
            trigger,
            resourceType: collection.slug,
            resourceSlug: (doc as any).slug as string,
            ...(collection.slug === 'posts' ? { post: doc.id } : {}),
            postSlug: (doc as any).slug as string,
            responseStatus,
            errorMessage: `HTTP ${responseStatus}: ${response.statusText}\n${errorText}`,
          },
          req,
          overrideAccess: true,
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        payload.logger.error(`Failed to log deployment error: ${errorMsg}`)
      }
    }
  } catch (error) {
    // Network error or other exception
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    payload.logger.error(`Rebuild trigger error: ${errorMessage}`)
    payload.logger.error('Post was saved, but rebuild did not trigger')

    // Log the error
    try {
      await payload.create({
        collection: 'deployment-logs',
        data: {
          status: 'failed' as DeploymentStatus,
          trigger,
          resourceType: collection.slug,
          resourceSlug: (doc as any).slug as string,
          ...(collection.slug === 'posts' ? { post: doc.id } : {}),
          postSlug: (doc as any).slug as string,
          errorMessage: `Exception: ${errorMessage}`,
        },
        req,
        overrideAccess: true,
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      payload.logger.error(`Failed to log deployment error: ${errorMsg}`)
    }
  }

  return doc
}

/**
 * Trigger rebuild when a published post is deleted
 */
export const triggerRebuildOnDelete: CollectionAfterDeleteHook = async ({
  req,
  doc,
  collection,
}) => {
  const { payload } = req

  // Check deployment settings
  try {
    const settings = await payload.findGlobal({
      slug: 'deployment-settings',
      depth: 0,
    })

    // Check if this collection is enabled for deployments
    const enabledCollections = (settings.enabledCollections ?? []).filter(isDeployableCollectionSlug)
    if (!isDeployableCollectionSlug(collection.slug)) {
      payload.logger.info(
        `Skipped rebuild on delete - "${collection.slug}" is not a deployable collection`,
      )
      return doc
    }

    if (!enabledCollections.includes(collection.slug)) {
      payload.logger.info(
        `Skipped rebuild on delete - "${collection.slug}" not enabled in deployment settings`,
      )
      return doc
    }

    // Check if delete deployments are enabled
    if (!settings.deployOnDelete) {
      payload.logger.info('Skipped rebuild - deployOnDelete is disabled')
      return doc
    }
  } catch (err) {
    payload.logger.error('Failed to fetch deployment settings, skipping deployment')
    return doc
  }

  // Only rebuild if the deleted post was published
  if ((doc as any)._status !== 'published') {
    payload.logger.info(`Skipped rebuild for deleted draft: ${(doc as any).slug}`)
    return doc
  }

  const deployHook = process.env.CLOUDFLARE_DEPLOY_HOOK

  if (!deployHook) {
    payload.logger.warn('CLOUDFLARE_DEPLOY_HOOK not set')

    // Log the failed attempt
    try {
      await payload.create({
        collection: 'deployment-logs',
        data: {
          status: 'failed' as DeploymentStatus,
          trigger: getDeploymentTrigger({
            collectionSlug: collection.slug,
            operationType: 'deleted',
          }),
          resourceType: collection.slug,
          resourceSlug: (doc as any).slug as string,
          postSlug: (doc as any).slug as string,
          errorMessage: 'CLOUDFLARE_DEPLOY_HOOK environment variable not set',
        },
        req,
        overrideAccess: true,
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      payload.logger.error(`Failed to log deployment error: ${errorMsg}`)
    }

    return doc
  }

  payload.logger.info(`Triggering rebuild for deleted ${collection.slug}: "${(doc as any).slug}"`)

  try {
    const response = await fetch(deployHook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const responseStatus = response.status

    if (response.ok) {
      payload.logger.info(`Rebuild triggered after delete`)
      payload.logger.info(`Content will be removed from site in ~2-5 minutes`)

      // Parse response
      let cloudflareData: CloudflareDeployResponse = {}
      let buildId: string | undefined

      try {
        cloudflareData = (await response.json()) as CloudflareDeployResponse
        buildId = cloudflareData.result?.id
      } catch {
        // Response might not be JSON
      }

      // Log successful deployment
      try {
        await payload.create({
          collection: 'deployment-logs',
          data: {
            status: 'success' as DeploymentStatus,
            trigger: getDeploymentTrigger({
              collectionSlug: collection.slug,
              operationType: 'deleted',
            }),
            resourceType: collection.slug,
            resourceSlug: (doc as any).slug as string,
            postSlug: (doc as any).slug as string,
            buildId,
            responseStatus,
            cloudflareResponse: cloudflareData,
          },
          req,
          overrideAccess: true,
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        payload.logger.error(`Failed to log deployment: ${errorMsg}`)
      }
    } else {
      const errorText = await response.text()

      payload.logger.error(`Failed to trigger rebuild after delete`)
      payload.logger.error(`Status: ${responseStatus} ${response.statusText}`)

      // Log failed deployment
      try {
        await payload.create({
          collection: 'deployment-logs',
          data: {
            status: 'failed' as DeploymentStatus,
            trigger: getDeploymentTrigger({
              collectionSlug: collection.slug,
              operationType: 'deleted',
            }),
            resourceType: collection.slug,
            resourceSlug: (doc as any).slug as string,
            postSlug: (doc as any).slug as string,
            responseStatus,
            errorMessage: `HTTP ${responseStatus}: ${response.statusText}\n${errorText}`,
          },
          req,
          overrideAccess: true,
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        payload.logger.error(`Failed to log deployment error: ${errorMsg}`)
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    payload.logger.error(`Rebuild trigger error on delete: ${errorMessage}`)

    // Log the error
    try {
      await payload.create({
        collection: 'deployment-logs',
        data: {
          status: 'failed' as DeploymentStatus,
          trigger: getDeploymentTrigger({
            collectionSlug: collection.slug,
            operationType: 'deleted',
          }),
          resourceType: collection.slug,
          resourceSlug: (doc as any).slug as string,
          postSlug: (doc as any).slug as string,
          errorMessage: `Exception: ${errorMessage}`,
        },
        req,
        overrideAccess: true,
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      payload.logger.error(`Failed to log deployment error: ${errorMsg}`)
    }
  }

  return doc
}
