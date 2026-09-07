import { describe, it, expect } from 'vitest'
import { webcamStatusFromError, webcamErrorFrom, type WebcamStatus } from './webcamStatus'

/**
 * RC-55: the `getUserMedia` rejection → {@link WebcamStatus} mapping.
 *
 * Every cell constructs a real `DOMException` with the name the browser actually
 * rejects with, rather than a plain `Error` carrying prose. That distinction is
 * the point of the module: `new Error('Permission denied')` has `name === 'Error'`
 * and MUST fall through to the catch-all, because a message is vendor- and
 * locale-dependent and matching on it would silently stop working elsewhere.
 */
describe('webcamStatusFromError', () => {
  const CASES: ReadonlyArray<readonly [string, WebcamStatus]> = [
    ['NotAllowedError', 'denied'],
    ['PermissionDeniedError', 'denied'],
    ['SecurityError', 'denied'],
    ['NotFoundError', 'no-device'],
    ['DevicesNotFoundError', 'no-device'],
    ['OverconstrainedError', 'no-device'],
    ['ConstraintNotSatisfiedError', 'no-device'],
    ['NotReadableError', 'busy'],
    ['TrackStartError', 'busy'],
  ]

  it.each(CASES)('maps a %s rejection to %s', (name, expected) => {
    expect(webcamStatusFromError(new DOMException('whatever the browser said', name))).toBe(expected)
  })

  it('covers all three nameable causes the consumer must tell apart', () => {
    // A guard on the mapping's REACH, not on one entry: if a future edit collapsed
    // two causes onto one status, the table above would still pass cell by cell.
    expect(new Set(CASES.map(([, status]) => status))).toEqual(
      new Set<WebcamStatus>(['denied', 'no-device', 'busy']),
    )
  })

  it('falls through to error for an unrecognised DOMException name', () => {
    // AbortError is spec'd as "something else went wrong", which is what `error`
    // means here — so this is a deliberate omission from the table, not a gap.
    expect(webcamStatusFromError(new DOMException('aborted', 'AbortError'))).toBe('error')
    expect(webcamStatusFromError(new DOMException('boom', 'TypeError'))).toBe('error')
  })

  it('falls through to error for a rejection carrying no usable name', () => {
    // A plain Error's name is 'Error' — NOT a camera cause, however suggestive
    // its message. This is the cell that pins "map on name, never on text".
    expect(webcamStatusFromError(new Error('Permission denied'))).toBe('error')
    expect(webcamStatusFromError('NotAllowedError')).toBe('error')
    expect(webcamStatusFromError(null)).toBe('error')
    expect(webcamStatusFromError(undefined)).toBe('error')
    expect(webcamStatusFromError({})).toBe('error')
  })
})

describe('webcamErrorFrom', () => {
  it('keeps a DOMException name and message as plain strings', () => {
    // Read structurally: a DOMException is NOT `instanceof Error` under jsdom, so
    // an instanceof test would drop the real message in the very environment this
    // suite runs in.
    expect(new DOMException('x', 'NotAllowedError') instanceof Error).toBe(false)

    const detail = webcamErrorFrom(new DOMException('Permission dismissed', 'NotAllowedError'))
    expect(detail).toEqual({ name: 'NotAllowedError', message: 'Permission dismissed' })
    // Serialisable: the whole reason we do not hand a consumer the DOMException.
    expect(JSON.parse(JSON.stringify(detail))).toEqual(detail)
  })

  it('keeps a plain Error message, with an empty name for the unnamed case', () => {
    expect(webcamErrorFrom(new Error('Requested device not found'))).toEqual({
      name: 'Error',
      message: 'Requested device not found',
    })
  })

  it('substitutes a generic message when the rejection carried none', () => {
    expect(webcamErrorFrom({})).toEqual({ name: '', message: 'Failed to access camera' })
    expect(webcamErrorFrom(null)).toEqual({ name: '', message: 'Failed to access camera' })
    expect(webcamErrorFrom(new Error(''))).toEqual({ name: 'Error', message: 'Failed to access camera' })
  })
})
