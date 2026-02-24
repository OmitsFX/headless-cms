import type { CollectionSlug } from 'payload'

export const DEPLOYMENT_COLLECTION_OPTIONS = [
  { label: 'Posts', value: 'posts' },
  { label: 'Legal', value: 'legal' },
] as const

export type DeployableCollectionSlug = (typeof DEPLOYMENT_COLLECTION_OPTIONS)[number]['value']

const DEPLOYABLE_COLLECTION_SET: ReadonlySet<DeployableCollectionSlug> = new Set(
  DEPLOYMENT_COLLECTION_OPTIONS.map((option) => option.value),
)

export const isDeployableCollectionSlug = (
  slug: CollectionSlug | string,
): slug is DeployableCollectionSlug => {
  return DEPLOYABLE_COLLECTION_SET.has(slug as DeployableCollectionSlug)
}

