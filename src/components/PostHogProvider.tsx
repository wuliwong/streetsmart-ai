'use client'

import posthog from 'posthog-js'
import { useEffect } from 'react'

export function PostHogInit() {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      defaults: '2026-01-30',
    })
  }, [])

  return null
}
