// src/hooks/triggerRebuild.ts

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

// Type for Cloudflare deploy hook response
interface CloudflareDeployResponse {
  id?: string
  url?: string
  created_on?: string
  [key: string]: unknown
}

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

  // Determine trigger type
  let trigger: string
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
    payload.logger.info(`⏭️  Skipped rebuild for draft post: ${doc.slug}`)
    return doc
  }

  const deployHook = process.env.CLOUDFLARE_DEPLOY_HOOK

  if (!deployHook) {
    payload.logger.warn('⚠️  CLOUDFLARE_DEPLOY_HOOK not set - skipping rebuild')
    
    // Log the failed attempt
    try {
      await payload.create({
        collection: 'deployment-logs',
        data: {
          status: 'failed',
          trigger,
          post: doc.id,
          postSlug: doc.slug,
          errorMessage: 'CLOUDFLARE_DEPLOY_HOOK environment variable not set',
        },
      })
    } catch (logError) {
      payload.logger.error('Failed to log deployment error:', logError)
    }
    
    return doc
  }

  // Log rebuild trigger
  const statusChange = previousDoc?.status
    ? `${previousDoc.status} → ${doc.status}`
    : doc.status

  payload.logger.info(`🚀 Triggering rebuild for post: "${doc.slug}"`)
  payload.logger.info(`   Operation: ${operation}, Status: ${statusChange}`)

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
      payload.logger.info(`✅ Rebuild triggered successfully`)

      // Parse Cloudflare response
      let cloudflareData: CloudflareDeployResponse = {}
      let buildId: string | undefined

      try {
        cloudflareData = (await response.json()) as CloudflareDeployResponse
        buildId = cloudflareData.id

        if (buildId) {
          payload.logger.info(`   Build ID: ${buildId}`)
        }
      } catch {
        // Response might not be JSON, that's okay
      }

      payload.logger.info(`   Your site will update in ~2-5 minutes`)

      // Log successful deployment
      await payload.create({
        collection: 'deployment-logs',
        data: {
          status: 'success',
          trigger,
          post: doc.id,
          postSlug: doc.slug,
          buildId,
          responseStatus,
          deployHookUrl: deployHook,
          cloudflareResponse: cloudflareData,
        },
      })
    } else {
      // Failed to trigger rebuild
      const errorText = await response.text()

      payload.logger.error(`❌ Failed to trigger rebuild`)
      payload.logger.error(`   Status: ${responseStatus} ${response.statusText}`)

      // Log failed deployment
      await payload.create({
        collection: 'deployment-logs',
        data: {
          status: 'failed',
          trigger,
          post: doc.id,
          postSlug: doc.slug,
          responseStatus,
          errorMessage: `HTTP ${responseStatus}: ${response.statusText}\n${errorText}`,
          deployHookUrl: deployHook,
        },
      })
    }
  } catch (error) {
    // Network error or other exception
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    payload.logger.error('❌ Rebuild trigger error:', error)
    payload.logger.error('   Post was saved, but rebuild did not trigger')

    // Log the error
    try {
      await payload.create({
        collection: 'deployment-logs',
        data: {
          status: 'failed',
          trigger,
          post: doc.id,
          postSlug: doc.slug,
          errorMessage: `Exception: ${errorMessage}`,
          deployHookUrl: deployHook,
        },
      })
    } catch (logError) {
      payload.logger.error('Failed to log deployment error:', logError)
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
}) => {
  const { payload } = req

  // Only rebuild if the deleted post was published
  if (doc.status !== 'published') {
    payload.logger.info(`⏭️  Skipped rebuild for deleted draft: ${doc.slug}`)
    return doc
  }

  const deployHook = process.env.CLOUDFLARE_DEPLOY_HOOK

  if (!deployHook) {
    payload.logger.warn('⚠️  CLOUDFLARE_DEPLOY_HOOK not set')
    
    // Log the failed attempt
    try {
      await payload.create({
        collection: 'deployment-logs',
        data: {
          status: 'failed',
          trigger: 'post-deleted',
          postSlug: doc.slug,
          errorMessage: 'CLOUDFLARE_DEPLOY_HOOK environment variable not set',
        },
      })
    } catch (logError) {
      payload.logger.error('Failed to log deployment error:', logError)
    }
    
    return doc
  }

  payload.logger.info(`🗑️  Triggering rebuild for deleted post: "${doc.slug}"`)

  try {
    const response = await fetch(deployHook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const responseStatus = response.status

    if (response.ok) {
      payload.logger.info(`✅ Rebuild triggered after delete`)
      payload.logger.info(`   Post will be removed from site in ~2-5 minutes`)

      // Parse response
      let cloudflareData: CloudflareDeployResponse = {}
      let buildId: string | undefined

      try {
        cloudflareData = (await response.json()) as CloudflareDeployResponse
        buildId = cloudflareData.id
      } catch {
        // Response might not be JSON
      }

      // Log successful deployment
      await payload.create({
        collection: 'deployment-logs',
        data: {
          status: 'success',
          trigger: 'post-deleted',
          postSlug: doc.slug,
          buildId,
          responseStatus,
          deployHookUrl: deployHook,
          cloudflareResponse: cloudflareData,
        },
      })
    } else {
      const errorText = await response.text()

      payload.logger.error(`❌ Failed to trigger rebuild after delete`)
      payload.logger.error(`   Status: ${responseStatus} ${response.statusText}`)

      // Log failed deployment
      await payload.create({
        collection: 'deployment-logs',
        data: {
          status: 'failed',
          trigger: 'post-deleted',
          postSlug: doc.slug,
          responseStatus,
          errorMessage: `HTTP ${responseStatus}: ${response.statusText}\n${errorText}`,
          deployHookUrl: deployHook,
        },
      })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    payload.logger.error('❌ Rebuild trigger error on delete:', error)

    // Log the error
    try {
      await payload.create({
        collection: 'deployment-logs',
        data: {
          status: 'failed',
          trigger: 'post-deleted',
          postSlug: doc.slug,
          errorMessage: `Exception: ${errorMessage}`,
          deployHookUrl: deployHook,
        },
      })
    } catch (logError) {
      payload.logger.error('Failed to log deployment error:', logError)
    }
  }

  return doc
}