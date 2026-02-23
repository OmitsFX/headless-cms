// src/components/DeploymentLogsView.tsx
'use client'

import React, { useEffect, useState } from 'react'

interface DeploymentLog {
  id: string
  status: 'success' | 'failed' | 'pending'
  trigger: string
  post?: {
    id: string
    title: string
    slug: string
  }
  postSlug?: string
  buildId?: string
  responseStatus?: number
  errorMessage?: string
  createdAt: string
}

// Type for Payload API response
interface PayloadResponse {
  docs: DeploymentLog[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function DeploymentLogsView() {
  const [logs, setLogs] = useState<DeploymentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      
      // Use REST API to fetch deployment logs
      const response = await fetch('/api/deployment-logs?limit=50&sort=-createdAt', {
        credentials: 'include', // Include auth cookies
      })

      if (!response.ok) {
        throw new Error('Failed to fetch logs')
      }

      const data = (await response.json()) as PayloadResponse
      setLogs(data.docs || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅'
      case 'failed':
        return '❌'
      case 'pending':
        return '⏳'
      default:
        return '❓'
    }
  }

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'post-published':
        return 'Post Published'
      case 'post-updated':
        return 'Post Updated'
      case 'post-deleted':
        return 'Post Deleted'
      case 'manual':
        return 'Manual Trigger'
      default:
        return trigger
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading deployment logs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        <p>Error: {error}</p>
        <button onClick={fetchLogs}>Retry</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
          Deployment Logs
        </h1>
        <button
          onClick={fetchLogs}
          style={{
            padding: '0.5rem 1rem',
            background: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {logs.length === 0 ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            background: '#f5f5f5',
            borderRadius: '8px',
          }}
        >
          <p style={{ margin: 0, color: '#666' }}>No deployment logs yet</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Trigger</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Post</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Build ID</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: '1px solid #eee',
                    background: log.status === 'failed' ? '#fff5f5' : 'white',
                  }}
                >
                  <td style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{getStatusIcon(log.status)}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>{getTriggerLabel(log.trigger)}</td>
                  <td style={{ padding: '1rem' }}>
                    {log.post ? (
                      <a
                        href={`/admin/collections/posts/${log.post.id}`}
                        style={{ color: '#0066cc', textDecoration: 'none' }}
                      >
                        {log.post.title || log.post.slug}
                      </a>
                    ) : (
                      <span style={{ color: '#999' }}>{log.postSlug || 'N/A'}</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {log.buildId ? (
                      <code style={{ fontSize: '0.9em', color: '#666' }}>
                        {log.buildId.substring(0, 8)}...
                      </code>
                    ) : (
                      <span style={{ color: '#999' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9em', color: '#666' }}>
                    {formatDate(log.createdAt)}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {log.errorMessage ? (
                      <details>
                        <summary
                          style={{
                            cursor: 'pointer',
                            color: '#cc0000',
                            fontWeight: 'bold',
                          }}
                        >
                          Error
                        </summary>
                        <pre
                          style={{
                            marginTop: '0.5rem',
                            padding: '0.5rem',
                            background: '#f5f5f5',
                            borderRadius: '4px',
                            fontSize: '0.85em',
                            overflow: 'auto',
                          }}
                        >
                          {log.errorMessage}
                        </pre>
                      </details>
                    ) : (
                      <span style={{ color: '#999' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #bfdbfe',
        }}
      >
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>About Deployments</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#333' }}>
          <li>Deployments are triggered automatically when you publish, update, or delete posts</li>
          <li>Each deployment rebuilds your entire website (true SSG)</li>
          <li>Builds typically complete in 2-5 minutes</li>
          <li>You can view build status in your Cloudflare Pages dashboard</li>
        </ul>
      </div>
    </div>
  )
}