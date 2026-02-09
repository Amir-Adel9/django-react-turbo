import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { useDebounce } from './use-debounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500))
    expect(result.current).toBe('test')
  })

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    )

    expect(result.current).toBe('initial')

    rerender({ value: 'updated', delay: 500 })
    expect(result.current).toBe('initial') // Still initial

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current).toBe('updated')
  })

  it('cancels previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'first', delay: 500 },
      }
    )

    act(() => {
      rerender({ value: 'second', delay: 500 })
      vi.advanceTimersByTime(300)
      rerender({ value: 'third', delay: 500 })
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('first') // Still first

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current).toBe('third') // Only third after full delay
  })
})
