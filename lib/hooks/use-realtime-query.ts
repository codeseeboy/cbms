"use client"

import { useQuery, type UseQueryOptions } from "@tanstack/react-query"

export function useRealtimeQuery<TData>(
  options: UseQueryOptions<TData> & {
    realtimeMs?: number
    staleMs?: number
  }
) {
  const { realtimeMs = 15_000, staleMs = 30_000, ...rest } = options
  return useQuery({
    refetchInterval: realtimeMs,
    staleTime: staleMs,
    refetchOnWindowFocus: true,
    ...rest,
  })
}
