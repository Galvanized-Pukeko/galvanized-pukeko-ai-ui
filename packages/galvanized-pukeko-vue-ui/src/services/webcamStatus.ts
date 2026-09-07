/**
 * The camera-status vocabulary a webcam surface reports to its host (RC-55).
 *
 * `PkWebcamPanel` has always known why it has no frames — `getUserMedia` either
 * rejected, or has simply not resolved yet — but nothing left the component, so
 * every consumer saw only "no frame". Two things followed downstream, both
 * measured while building RC-53: a capture failure could not name its cause, and
 * a consumer with no way to tell "denied" from "still starting" had to keep
 * waiting, so a denied camera burned the caller's whole readiness deadline on
 * every call.
 *
 * This module is the shared vocabulary for that signal — a small discriminated
 * status plus a serialisable detail, deliberately NOT a raw `DOMException`,
 * which does not survive a structured clone or a JSON envelope.
 */

/**
 * Why a webcam surface does or does not have frames.
 *
 * The question a consumer actually asks is **"will waiting help?"**, so each
 * state is documented with that answer. Exactly one state says yes.
 *
 * - `idle`      — no capture attempt is in flight (before the first start, or
 *                 after `stopCamera()`). Waiting will NOT help; start the camera.
 * - `starting`  — a `getUserMedia` call is in flight and has not settled.
 *                 Waiting MAY help. This is the only state where it can.
 * - `live`      — `getUserMedia` resolved and the stream is open.
 *                 Waiting will not help; capture should already work.
 * - `denied`    — permission was refused. Waiting will NOT help; only the user
 *                 changing a browser permission will.
 * - `no-device` — no camera matched the request. Waiting will NOT help.
 * - `busy`      — the device exists but is held by another application. Waiting
 *                 will NOT help, though a later retry may once it is released.
 * - `error`     — rejected for a reason we cannot name. Waiting will NOT help.
 *
 * The union is closed and every value is a plain string, so it round-trips
 * through JSON and through an AG-UI tool envelope unchanged.
 */
export type WebcamStatus =
  | 'idle'
  | 'starting'
  | 'live'
  | 'denied'
  | 'no-device'
  | 'busy'
  | 'error'

/**
 * The optional detail beside a failure {@link WebcamStatus}: the browser's own
 * error name and message, both plain strings.
 *
 * Kept separate from the status so the status stays a stable, closed vocabulary
 * a consumer can branch on, while the detail carries the unbounded,
 * vendor- and locale-dependent text that is only ever shown to a human.
 */
export interface WebcamError {
  /**
   * The browser's error name, e.g. `NotAllowedError` — the value
   * {@link webcamStatusFromError} mapped. Empty when the rejection carried no
   * name (a bare string throw, say).
   */
  name: string
  /** The browser's message, or a generic fallback when there was none. */
  message: string
}

/** Shown when a rejection carried no usable message of its own. */
const GENERIC_FAILURE_MESSAGE = 'Failed to access camera'

/**
 * `getUserMedia` rejection names, mapped to the status they mean.
 *
 * Keyed on `DOMException.name` and NEVER on message text: the name is specified
 * and stable, while the message is vendor- and locale-dependent, so matching on
 * it would silently stop working in another browser or another language.
 *
 * The legacy aliases are the pre-standard names older Chrome and Firefox builds
 * still emit. `OverconstrainedError` lands on `no-device` because the consumer's
 * decision is identical — no attached device can serve this request, so waiting
 * cannot change the outcome. `AbortError` is deliberately absent: the spec
 * defines it as "something went wrong that did not fit the other errors", which
 * is precisely what `error` means here.
 */
const STATUS_BY_ERROR_NAME: Readonly<Record<string, WebcamStatus>> = {
  NotAllowedError: 'denied',
  PermissionDeniedError: 'denied', // legacy Chrome/Firefox
  SecurityError: 'denied',
  NotFoundError: 'no-device',
  DevicesNotFoundError: 'no-device', // legacy Chrome
  OverconstrainedError: 'no-device',
  ConstraintNotSatisfiedError: 'no-device', // legacy Chrome
  NotReadableError: 'busy',
  TrackStartError: 'busy', // legacy Chrome
}

/** Read a string property off an unknown throwable without assuming its type. */
function stringProperty(err: unknown, key: 'name' | 'message'): string {
  const value = (err as Record<string, unknown> | null | undefined)?.[key]
  return typeof value === 'string' ? value : ''
}

/**
 * Classify a `getUserMedia` rejection into a {@link WebcamStatus}.
 *
 * Anything unrecognised — including a rejection that is not an object at all —
 * becomes `error`, so the vocabulary stays closed and a consumer's switch never
 * falls through to `undefined`.
 */
export function webcamStatusFromError(err: unknown): WebcamStatus {
  return STATUS_BY_ERROR_NAME[stringProperty(err, 'name')] ?? 'error'
}

/**
 * Reduce a `getUserMedia` rejection to the serialisable {@link WebcamError}
 * detail.
 *
 * Reads `name`/`message` structurally rather than through `instanceof Error`,
 * because `DOMException` — the type `getUserMedia` actually rejects with — is
 * not an `Error` subclass under jsdom, so an `instanceof` test would throw the
 * real message away in exactly the environment the unit suite runs in.
 */
export function webcamErrorFrom(err: unknown): WebcamError {
  return {
    name: stringProperty(err, 'name'),
    message: stringProperty(err, 'message') || GENERIC_FAILURE_MESSAGE,
  }
}
