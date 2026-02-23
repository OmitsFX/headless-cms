// src/hooks/triggerRebuild.ts

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

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
type DeploymentTrigger = 'post-published' | 'post-updated' | 'post-deleted' | 'manual'
type DeploymentStatus = 'success' | 'failed' | 'pending'

/**
 * Trigger full static site rebuild via Cloudflare Pages deploy hook
 * Maintains true SSG architecture - all pages pre-built at deploy time
 * Logs all deployments to the deployment-logs collection
 */
export const triggerRebuild: CollectionAfterChangeHook = async ({
  doc,
  req,
  previousDoc,
  operation,
}) => {
  const { payload } = req

  // Only trigger rebuild if status is published or was published
  const isPublished = doc.status === 'published'
  const wasPublished = previousDoc?.status === 'published'

  // Determine trigger type - use proper types
  let trigger: DeploymentTrigger
  if (!previousDoc) {
    trigger = 'post-published'
  } else if (previousDoc.status !== 'published' && doc.status === 'published') {
    trigger = 'post-published'
  } else if (previousDoc.status === 'published' && doc.status !== 'published') {
    trigger = 'post-updated' // Unpublishing
  } else if (previousDoc.status === 'published' && doc.status === 'published') {
    trigger = 'post-updated'
  } else {
    trigger = 'post-updated'
  }

  // Should we rebuild?
  const shouldRebuild = isPublished || wasPublished

  if (!shouldRebuild) {
    // Draft saved, no rebuild needed
    payload.logger.info(`Skipped rebuild for draft post: ${doc.slug}`)
    return doc
  }

  const deployHook = process.env.CLOUDFLARE_DEPLOY_HOOK

  if (!deployHook) {
    payload.logger.warn('CLOUDFLARE_DEPLOY_HOOK not set - skipping rebuild')

    // Log the failed attempt
    payload
      .create({
        collection: 'deployment-logs',
        data: {
          status: 'failed' as DeploymentStatus,
          trigger,
          post: doc.id,
          postSlug: doc.slug as string,
          errorMessage: 'CLOUDFLARE_DEPLOY_HOOK environment variable not set',
        },
        overrideAccess: true,
      })
      .catch((err) => {
        const errorMsg = err instanceof Error ? err.message : String(err)
        payload.logger.error(`Failed to log deployment error: ${errorMsg}`)
      })

    return doc
  }

  // Log rebuild trigger
  const statusChange = previousDoc?.status ? `${previousDoc.status} → ${doc.status}` : doc.status

  payload.logger.info(`Triggering rebuild for post: "${doc.slug}"`)
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

      // Log successful deployment - don't wait for this
      payload
        .create({
          collection: 'deployment-logs',
          data: {
            status: 'success' as DeploymentStatus,
            trigger,
            post: doc.id,
            postSlug: doc.slug as string,
            buildId,
            responseStatus,
            cloudflareResponse: cloudflareData,
          },
          overrideAccess: true,
        })
        .catch((err) => {
          const errorMsg = err instanceof Error ? err.message : String(err)
          payload.logger.error(`Failed to log deployment: ${errorMsg}`)
        })
    } else {
      // Failed to trigger rebuild
      const errorText = await response.text()

      payload.logger.error(`Failed to trigger rebuild`)
      payload.logger.error(`Status: ${responseStatus} ${response.statusText}`)

      // Log failed deployment
      payload
        .create({
          collection: 'deployment-logs',
          data: {
            status: 'failed' as DeploymentStatus,
            trigger,
            post: doc.id,
            postSlug: doc.slug as string,
            responseStatus,
            errorMessage: `HTTP ${responseStatus}: ${response.statusText}\n${errorText}`,
          },
          overrideAccess: true,
        })
        .catch((err) => {
          const errorMsg = err instanceof Error ? err.message : String(err)
          payload.logger.error(`Failed to log deployment error: ${errorMsg}`)
        })
    }
  } catch (error) {
    // Network error or other exception
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    payload.logger.error(`Rebuild trigger error: ${errorMessage}`)
    payload.logger.error('Post was saved, but rebuild did not trigger')

    // Log the error
    payload
      .create({
        collection: 'deployment-logs',
        data: {
          status: 'failed' as DeploymentStatus,
          trigger,
          post: doc.id,
          postSlug: doc.slug as string,
          errorMessage: `Exception: ${errorMessage}`,
        },
        overrideAccess: true,
      })
      .catch((err) => {
        const errorMsg = err instanceof Error ? err.message : String(err)
        payload.logger.error(`Failed to log deployment error: ${errorMsg}`)
      })
  }

  return doc
}

/**
 * Trigger rebuild when a published post is deleted
 */
export const triggerRebuildOnDelete: CollectionAfterDeleteHook = async ({ req, doc }) => {
  const { payload } = req

  // Only rebuild if the deleted post was published
  if (doc.status !== 'published') {
    payload.logger.info(`Skipped rebuild for deleted draft: ${doc.slug}`)
    return doc
  }

  const deployHook = process.env.CLOUDFLARE_DEPLOY_HOOK

  if (!deployHook) {
    payload.logger.warn('CLOUDFLARE_DEPLOY_HOOK not set')

    // Log the failed attempt
    payload
      .create({
        collection: 'deployment-logs',
        data: {
          status: 'failed' as DeploymentStatus,
          trigger: 'post-deleted' as DeploymentTrigger,
          postSlug: doc.slug as string,
          errorMessage: 'CLOUDFLARE_DEPLOY_HOOK environment variable not set',
        },
        overrideAccess: true,
      })
      .catch((err) => {
        const errorMsg = err instanceof Error ? err.message : String(err)
        payload.logger.error(`Failed to log deployment error: ${errorMsg}`)
      })

    return doc
  }

  payload.logger.info(`Triggering rebuild for deleted post: "${doc.slug}"`)

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
      payload.logger.info(`Post will be removed from site in ~2-5 minutes`)

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
      payload
        .create({
          collection: 'deployment-logs',
          data: {
            status: 'success' as DeploymentStatus,
            trigger: 'post-deleted' as DeploymentTrigger,
            postSlug: doc.slug as string,
            buildId,
            responseStatus,
            cloudflareResponse: cloudflareData,
          },
          overrideAccess: true,
        })
        .catch((err) => {
          const errorMsg = err instanceof Error ? err.message : String(err)
          payload.logger.error(`Failed to log deployment: ${errorMsg}`)
        })
    } else {
      const errorText = await response.text()

      payload.logger.error(`Failed to trigger rebuild after delete`)
      payload.logger.error(`Status: ${responseStatus} ${response.statusText}`)

      // Log failed deployment
      payload
        .create({
          collection: 'deployment-logs',
          data: {
            status: 'failed' as DeploymentStatus,
            trigger: 'post-deleted' as DeploymentTrigger,
            postSlug: doc.slug as string,
            responseStatus,
            errorMessage: `HTTP ${responseStatus}: ${response.statusText}\n${errorText}`,
          },
          overrideAccess: true,
        })
        .catch((err) => {
          const errorMsg = err instanceof Error ? err.message : String(err)
          payload.logger.error(`Failed to log deployment error: ${errorMsg}`)
        })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    payload.logger.error(`Rebuild trigger error on delete: ${errorMessage}`)

    // Log the error
    payload
      .create({
        collection: 'deployment-logs',
        data: {
          status: 'failed' as DeploymentStatus,
          trigger: 'post-deleted' as DeploymentTrigger,
          postSlug: doc.slug as string,
          errorMessage: `Exception: ${errorMessage}`,
        },
        overrideAccess: true,
      })
      .catch((err) => {
        const errorMsg = err instanceof Error ? err.message : String(err)
        payload.logger.error(`Failed to log deployment error: ${errorMsg}`)
      })
  }

  return doc
}
