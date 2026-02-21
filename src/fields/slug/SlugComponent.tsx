'use client'

import React, { useCallback, useEffect } from 'react'
import {
  useField,
  useFormFields,
  TextInput,
  CheckboxInput,
  FieldLabel,
  FieldDescription,
} from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'
import { formatSlug } from './formatSlug'

export const SlugComponent: TextFieldClientComponent = ({ path, field }) => {
  const { value, setValue } = useField<string>({ path })
  
  // Resolve the path for the slugLock sibling field
  const lockFieldPath = path.includes('.') 
    ? `${path.split('.').slice(0, -1).join('.')}.slugLock` 
    : 'slugLock'

  const { value: slugLock, setValue: setSlugLock } = useField<boolean>({ path: lockFieldPath })
  
  // Watch the title field to auto-generate slug
  const title = useFormFields(([fields]) => fields.title?.value)

  const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    // If the user manually edits, lock the slug
    if (newValue !== value) {
      setSlugLock(true)
    }
  }, [setValue, setSlugLock, value])

  useEffect(() => {
    // Only auto-generate if NOT locked and title exists
    if (!slugLock && title) {
      let titleToUse = ''
      if (typeof title === 'string') {
        titleToUse = title
      } else if (typeof title === 'object' && title !== null) {
        // If localized, prioritize 'en' as requested
        titleToUse = (title as any).en || Object.values(title)[0] || ''
      }
      
      if (titleToUse) {
        const formattedSlug = formatSlug(titleToUse)
        if (value !== formattedSlug) {
          setValue(formattedSlug)
        }
      }
    }
  }, [title, slugLock, value, setValue])

  return (
    <div className="field-type text">
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '5px' 
        }}
      >
        <FieldLabel label={field.label || 'Slug'} path={path} required={field.required} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
          <CheckboxInput 
            checked={Boolean(slugLock)} 
            onToggle={() => setSlugLock(!slugLock)}
          />
          <label 
            htmlFor={`field-${lockFieldPath.replace(/\./g, '__')}`} 
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            Lock Slug
          </label>
        </div>
      </div>
      <TextInput 
        path={path} 
        value={value} 
        onChange={handleSlugChange}
      />
      {field.admin?.description && (
        <FieldDescription 
          description={field.admin.description} 
          path={path} 
        />
      )}
    </div>
  )
}
