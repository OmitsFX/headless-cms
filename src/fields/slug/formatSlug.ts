import type { FieldHook } from 'payload'

export const formatSlug = (val: string): string =>
  val
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .toLowerCase()

export const formatSlugHook =
  (fallback: string): FieldHook =>
  ({ data, siblingData, value }) => {
    // If slug is locked and has a value, format and return it
    if (typeof value === 'string' && value && siblingData?.slugLock) {
      return formatSlug(value)
    }

    // Attempt to get the source field value (usually 'title')
    const sourceFieldValue = data?.[fallback]
    
    // If sourceFieldValue is localized (object), prioritize 'en'
    if (sourceFieldValue && typeof sourceFieldValue === 'object') {
      const enValue = sourceFieldValue.en
      if (typeof enValue === 'string' && enValue) {
        return formatSlug(enValue)
      }
      
      // Fallback to the first available string value in the localized object if 'en' is missing
      const firstAvailable = Object.values(sourceFieldValue).find(val => typeof val === 'string' && val)
      if (firstAvailable) {
        return formatSlug(firstAvailable as string)
      }
    }

    // Fallback if sourceFieldValue is a direct string
    if (typeof sourceFieldValue === 'string' && sourceFieldValue) {
      return formatSlug(sourceFieldValue)
    }

    // If no title found but we have a value, use value
    if (value && typeof value === 'string') {
      return formatSlug(value)
    }

    return value
  }