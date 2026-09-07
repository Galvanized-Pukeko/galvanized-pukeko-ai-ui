/**
 * Generic single-frame webcam capture client-tool (PLAT-18).
 *
 * Promoted up from pukeko-robot-controller: a single-frame webcam capture is a
 * general capability, not robot-specific. This module is the shared "thin tool
 * layer" — the `capture_image` tool declaration, the capture-to-envelope
 * handler, and small capture-source helpers — so any host registers the tool
 * once and it works on BOTH UI surfaces:
 *
 *   - bespoke `ChatInterface`: spread {@link createCaptureImageClientTool} into
 *     its `clientTools` / `clientToolHandlers` props;
 *   - headless CopilotKit: pass `createCaptureImageFrontendTool()` (from the
 *     `./copilot` sub-export, which wraps {@link captureImageResult}) through
 *     the `frontendTools` prop of `HeadlessChatApp` / `PukekoCopilot`.
 *
 * ## Frozen contract (RC-14)
 * The tool NAME (`capture_image`) and the result envelope — a JSON string of
 * `{ mimeType, data }` on success or `{ error }` on failure — are load-bearing:
 * per-tool result renderers (PLAT-17; e.g. the robot's inline thumbnail) and
 * server-side middleware key on both. Do not change either shape here.
 *
 * ## Server side
 * No server-side stub is required for a gaunt-sloth AG-UI host: the server
 * binds any client-declared run-input tool as a `metadata.client = true`
 * interrupt stub (apiAgUiModule's `buildClientToolStub`), suspending the graph
 * for the browser to fulfil. Hosts that statically configure their agent's
 * tools may still declare their own equivalent stub server-side, but it is
 * redundant as soon as the client declares `capture_image` in the run input.
 */
import type { Tool } from '@ag-ui/client'
import type { WebcamStatus } from './webcamStatus'

/** The frozen client-tool name (RC-14: renderers + middleware key on it). */
export const CAPTURE_IMAGE_TOOL_NAME = 'capture_image'

/**
 * Generic model-facing description. Hosts with a more specific camera (e.g.
 * the robot's overhead webcam) should override it via the factory options so
 * the model knows what the frame actually shows.
 */
export const CAPTURE_IMAGE_DEFAULT_DESCRIPTION =
  'Capture a single photo from the webcam. Returns the current image as seen by the camera.'

/** The success envelope: a base64 image + its mime type (RC-14 frozen shape). */
export interface ImageEnvelope {
  mimeType: string
  data: string
}

/**
 * Where frames come from. Structurally satisfied by the robot's injected
 * browser capabilities and by {@link webcamPanelCaptureSource} /
 * {@link createOnDemandCaptureSource}. `captureFrame` may be async (an
 * on-demand source has to open the camera first).
 */
export interface ImageCaptureSource {
  /** Whether the camera is usable yet (guards the "Webcam not initialized" case). */
  isReady(): boolean
  /** A `data:image/...;base64,` URL of the current frame, or null on failure. */
  captureFrame(): string | null | Promise<string | null>
  /**
   * Optional (RC-55): why the camera does or does not have frames, so a failed
   * capture can name its cause instead of asking the model a question it cannot
   * answer. A method rather than a property so it is read at capture time — the
   * status changes underneath a long-lived source.
   *
   * A source that cannot know its camera's state simply omits this, and
   * {@link captureImageResult} falls back to the frozen message. That is why the
   * hook is opt-in: adding it changed no existing source's output.
   */
  cameraStatus?(): WebcamStatus | null | undefined
}

/**
 * Parse a `{ mimeType, data }` image envelope out of a `data:` URL, or null if
 * the string isn't a well-formed base64 image data URL. Pure. Moved verbatim
 * from pukeko-robot-controller's interpreter (PLAT-18) — the robot re-exports
 * this one, and its badge-side envelope parser mirrors this grammar.
 */
export function frameToEnvelope(frame: string | null): ImageEnvelope | null {
  if (!frame) return null
  const match = frame.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,([^"]*)$/)
  if (!match) return null
  return { mimeType: match[1], data: match[2] }
}

/**
 * The capture-failed message used when the cause is not knowable — the frozen
 * RC-14 string, unchanged. Every source that does not implement
 * {@link ImageCaptureSource.cameraStatus} still produces exactly this.
 */
export const CAPTURE_IMAGE_FAILED_ERROR = 'Failed to capture frame. Is the camera active?'

/**
 * Capture-failed messages for the causes we can actually name (RC-55).
 *
 * `Failed to capture frame.` is kept as a stable leading sentence — result
 * renderers and log scrapes key on it — and only the trailing question is
 * replaced, because asking a model "Is the camera active?" after it has already
 * waited out a readiness deadline tells it nothing it can act on.
 *
 * `live` and `error` are deliberately absent. Neither names a cause: `live`
 * means the camera is open and the capture failed for some other reason, and
 * `error` means the rejection was unrecognised. Both keep the frozen message,
 * which is exactly the "we do not know" the question already expresses.
 */
const CAPTURE_FAILURE_BY_STATUS: Partial<Record<WebcamStatus, string>> = {
  idle: 'Failed to capture frame. The camera is not running.',
  starting: 'Failed to capture frame. The camera has not finished starting.',
  denied: 'Failed to capture frame. Camera permission was denied.',
  'no-device': 'Failed to capture frame. No camera device was found.',
  busy: 'Failed to capture frame. The camera is in use by another application.',
}

/**
 * The capture-failed message for a camera status: one that names the cause where
 * we have one, and {@link CAPTURE_IMAGE_FAILED_ERROR} otherwise — including for
 * a null/undefined status, i.e. a source that cannot report one.
 */
export function captureFailureMessage(status: WebcamStatus | null | undefined): string {
  return (status && CAPTURE_FAILURE_BY_STATUS[status]) || CAPTURE_IMAGE_FAILED_ERROR
}

/**
 * The generic `capture_image` handler body: capture one frame from `source`
 * and return the JSON string handed back to the model — the success envelope
 * or an `{ error }` envelope. The envelope SHAPE is part of the frozen RC-14
 * contract (the robot's UI and tests key on it).
 *
 * The capture-failed message names its cause when — and only when — the source
 * implements {@link ImageCaptureSource.cameraStatus} and that status identifies
 * one (RC-55). Otherwise it is the frozen string, byte for byte.
 */
export async function captureImageResult(source: ImageCaptureSource): Promise<string> {
  if (!source.isReady()) {
    return JSON.stringify({ error: 'Webcam not initialized' })
  }
  const envelope = frameToEnvelope(await source.captureFrame())
  if (envelope) return JSON.stringify(envelope)
  return JSON.stringify({ error: captureFailureMessage(source.cameraStatus?.()) })
}

export interface CaptureImageToolOptions {
  /** Model-facing description override (default {@link CAPTURE_IMAGE_DEFAULT_DESCRIPTION}). */
  description?: string
}

/**
 * The AG-UI run-input tool declaration for `capture_image` (no parameters).
 * This is what a bespoke host passes in `ChatInterface`'s `clientTools` and
 * what the gaunt-sloth AG-UI server binds as a client interrupt stub.
 */
export function createCaptureImageToolDeclaration(opts: CaptureImageToolOptions = {}): Tool {
  return {
    name: CAPTURE_IMAGE_TOOL_NAME,
    description: opts.description ?? CAPTURE_IMAGE_DEFAULT_DESCRIPTION,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  }
}

/**
 * Bespoke-path registration helper: everything `ChatInterface` needs to offer
 * `capture_image`, in its prop shapes. Spread into the host's arrays/maps:
 *
 * ```ts
 * const capture = createCaptureImageClientTool(source)
 * // <ChatInterface :client-tools="[capture.tool, ...]"
 * //                :client-tool-handlers="{ [capture.tool.name]: capture.handler, ... }" />
 * ```
 */
export function createCaptureImageClientTool(
  source: ImageCaptureSource,
  opts: CaptureImageToolOptions = {},
): { tool: Tool; handler: () => Promise<string> } {
  return {
    tool: createCaptureImageToolDeclaration(opts),
    handler: () => captureImageResult(source),
  }
}

/**
 * The part of a mounted `PkWebcamPanel`'s exposed surface this adapter reads.
 *
 * `cameraStatus` is optional so a panel too old to expose it — or any hand-rolled
 * stand-in — still satisfies the shape. Structurally identical to the inline type
 * this replaced, plus that one optional member.
 */
export interface WebcamPanelLike {
  captureFrame(): string | null
  /** RC-55: present on any `PkWebcamPanel` new enough to expose it. */
  cameraStatus?: WebcamStatus
}

/**
 * Adapt a mounted {@link WebcamPanelLike} panel (read lazily through a getter so
 * the panel need not exist yet at wiring time) into an {@link ImageCaptureSource}.
 * This is the shape hosts that already render a live webcam view use.
 *
 * `isReady` stays "is a panel mounted" and is deliberately NOT narrowed to "is
 * the camera usable": a denied camera reporting not-ready would swap this
 * source's envelope from the capture-failed message to `Webcam not initialized`
 * for every existing consumer. The camera's state reaches the model through the
 * capture-failed message instead (RC-55).
 */
export function webcamPanelCaptureSource(
  getPanel: () => WebcamPanelLike | null | undefined,
): ImageCaptureSource {
  return {
    isReady: () => getPanel() != null,
    captureFrame: () => getPanel()?.captureFrame() ?? null,
    // Read per capture: the panel's status changes under a long-lived source.
    cameraStatus: () => getPanel()?.cameraStatus ?? null,
  }
}

/** Options for {@link createOnDemandCaptureSource}. */
export interface OnDemandCaptureOptions {
  /** Longest frame edge after downscale (default 640, matching PkWebcamPanel). */
  maxSize?: number
  /** JPEG quality 0..1 (default 0.8, matching PkWebcamPanel). */
  quality?: number
  /**
   * Milliseconds to let the sensor settle after the first painted frame, before
   * drawing (default {@link DEFAULT_SETTLE_MS}). A camera opened seconds ago is
   * already exposed correctly; one opened microseconds ago is not.
   */
  settleMs?: number
}

/**
 * Sensor-settle delay after the first painted frame. A webcam's opening frames are
 * near-black while auto-exposure and auto-gain ramp up, and this source opens the
 * camera fresh on every capture, so it pays that cold start each time — unlike a
 * mounted {@link webcamPanelCaptureSource} panel, which has been streaming for
 * seconds by the time anyone captures from it.
 */
export const DEFAULT_SETTLE_MS = 300

/** Longest we wait for a decoded, painted frame before drawing anyway. */
const PAINTED_FRAME_TIMEOUT_MS = 2_000

/** `requestVideoFrameCallback` is not in every lib.dom we build against. */
type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: () => void) => number
}

/**
 * Resolve once the video has actually PAINTED a frame.
 *
 * `loadedmetadata` fires when the stream's dimensions are known — which is not the
 * same as a frame having been decoded and painted. Drawing at that point produces a
 * perfectly well-formed JPEG of pure black, which reads as a camera/permission fault
 * and is not one. `requestVideoFrameCallback` is the exact signal ("a new frame is
 * ready to display"); where it is unavailable, two chained animation frames give the
 * compositor a chance to present one.
 *
 * Always resolves — never rejects. If no frame is announced within
 * {@link PAINTED_FRAME_TIMEOUT_MS} we draw regardless, because a possibly-blank frame
 * still beats failing a capture the user explicitly asked for.
 */
async function waitForPaintedFrame(video: HTMLVideoElement): Promise<void> {
  const withCallback = video as VideoWithFrameCallback
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, PAINTED_FRAME_TIMEOUT_MS)
    const done = () => {
      clearTimeout(timer)
      resolve()
    }
    if (typeof withCallback.requestVideoFrameCallback === 'function') {
      withCallback.requestVideoFrameCallback(done)
    } else {
      requestAnimationFrame(() => requestAnimationFrame(done))
    }
  })
}

/**
 * A self-contained capture source for hosts with no visible webcam panel (e.g.
 * the headless chat): on each capture it opens `getUserMedia`, waits for the
 * first real frame, downscales to `maxSize` (PkWebcamPanel parity), encodes a
 * JPEG data URL, and releases the camera again. Returns null (→ the standard
 * "Failed to capture frame" envelope) when the camera is denied or absent.
 */
export function createOnDemandCaptureSource(opts: OnDemandCaptureOptions = {}): ImageCaptureSource {
  const maxSize = opts.maxSize ?? 640
  const quality = opts.quality ?? 0.8
  const settleMs = opts.settleMs ?? DEFAULT_SETTLE_MS

  async function grabFrame(): Promise<string | null> {
    const mediaDevices = navigator.mediaDevices
    if (!mediaDevices?.getUserMedia) return null
    let stream: MediaStream | null = null
    const video = document.createElement('video')
    video.muted = true
    // iOS Safari requires playsinline for an off-screen autoplaying video.
    video.playsInline = true
    try {
      stream = await mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      video.srcObject = stream
      await video.play()
      // Wait until the stream reports real dimensions (first decoded frame).
      if (video.videoWidth === 0) {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('camera frame timeout')), 10_000)
          video.onloadedmetadata = () => {
            clearTimeout(timer)
            resolve()
          }
        })
      }

      // Dimensions are known; a frame is not yet guaranteed to exist. Wait for one to
      // be painted, then let the sensor settle, or we encode pure black (RC-19).
      await waitForPaintedFrame(video)
      if (settleMs > 0) await new Promise((resolve) => setTimeout(resolve, settleMs))

      let width = video.videoWidth
      let height = video.videoHeight
      if (width === 0 || height === 0) return null
      const scale = Math.min(1, maxSize / Math.max(width, height))
      width = Math.round(width * scale)
      height = Math.round(height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.drawImage(video, 0, 0, width, height)
      return canvas.toDataURL('image/jpeg', quality)
    } catch (err) {
      console.warn('[captureImage] on-demand capture failed:', err)
      return null
    } finally {
      video.srcObject = null
      stream?.getTracks().forEach((track) => track.stop())
    }
  }

  return {
    // "Ready" here means capture is worth attempting: the browser has a camera
    // API at all. Permission/hardware failures surface as the capture-failed
    // envelope from grabFrame's null.
    isReady: () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
    captureFrame: () => grabFrame(),
  }
}

/** Mime type assumed when a snapshot response carries no `Content-Type`. */
export const DEFAULT_HTTP_SNAPSHOT_MIME = 'image/jpeg'

/** Default deadline for a snapshot fetch (see {@link HttpSnapshotCaptureOptions.timeoutMs}). */
export const DEFAULT_HTTP_SNAPSHOT_TIMEOUT_MS = 5_000

/** Options for {@link createHttpSnapshotCaptureSource}. */
export interface HttpSnapshotCaptureOptions {
  /**
   * The snapshot endpoint, read lazily on EVERY capture. A getter rather than a
   * string because the host a consumer points at is switchable at runtime, so a
   * URL captured at construction time would keep addressing the previous target.
   * Yield an empty/nullish value to mean "no target configured" — that is what
   * `isReady()` reports on.
   */
  getUrl: () => string | null | undefined
  /**
   * Milliseconds before the fetch is aborted (default
   * {@link DEFAULT_HTTP_SNAPSHOT_TIMEOUT_MS}). An unreachable host on an
   * access-point IP does not refuse the connection, it hangs; a turn parked
   * forever on a fetch is a worse failure than a reported capture error.
   */
  timeoutMs?: number
  /** Fetch implementation (default: the global `fetch`), injectable for tests. */
  fetch?: typeof globalThis.fetch
}

/** Base64-encode raw bytes without assuming a Node `Buffer` is present. */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  // Chunked so a large frame cannot blow the argument limit of String.fromCharCode.
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

/**
 * A capture source that fetches one frame over HTTP instead of opening a camera
 * — the shape shared by a robot's onboard snapshot endpoint and by a simulator
 * serving rendered frames. `GET`s {@link HttpSnapshotCaptureOptions.getUrl}'s
 * current value, reads the bytes, and returns them as a `data:` URL whose mime
 * type comes from the response's `Content-Type` (falling back to
 * {@link DEFAULT_HTTP_SNAPSHOT_MIME}).
 *
 * Every failure — non-2xx, a network throw, a timeout, or a non-`image/*`
 * content type such as a captive portal's HTML 200 — returns null and throws
 * nothing, so {@link captureImageResult} renders the frozen error envelope. The
 * content-type check exists so an HTML error page is rejected here, where the
 * reason can be logged, rather than one layer later inside
 * {@link frameToEnvelope}.
 */
export function createHttpSnapshotCaptureSource(
  options: HttpSnapshotCaptureOptions,
): ImageCaptureSource {
  const timeoutMs = options.timeoutMs ?? DEFAULT_HTTP_SNAPSHOT_TIMEOUT_MS

  /** The currently configured URL, or null when nothing is configured. */
  function currentUrl(): string | null {
    const url = options.getUrl()
    if (typeof url !== 'string') return null
    const trimmed = url.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  async function grabFrame(): Promise<string | null> {
    // Read the getter per capture: the target can change between captures.
    const url = currentUrl()
    if (!url) return null
    const doFetch = options.fetch ?? globalThis.fetch
    if (typeof doFetch !== 'function') return null
    try {
      const response = await doFetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (!response.ok) {
        console.warn(`[captureImage] snapshot fetch failed: HTTP ${response.status}`)
        return null
      }
      const header = response.headers.get('content-type') ?? ''
      const mime = header.split(';')[0].trim().toLowerCase() || DEFAULT_HTTP_SNAPSHOT_MIME
      if (!mime.startsWith('image/')) {
        console.warn(`[captureImage] snapshot response was not an image: ${mime}`)
        return null
      }
      const bytes = new Uint8Array(await response.arrayBuffer())
      return `data:${mime};base64,${bytesToBase64(bytes)}`
    } catch (err) {
      console.warn('[captureImage] snapshot capture failed:', err)
      return null
    }
  }

  return {
    // "Ready" means a capture is worth attempting — i.e. a target is configured.
    // Deliberately NOT a network probe: reachability is not knowable without
    // doing the fetch, and probing before every capture doubles the cost to
    // learn nothing. An unreachable target surfaces as the capture-failed
    // envelope from grabFrame's null.
    isReady: () => currentUrl() != null,
    captureFrame: () => grabFrame(),
  }
}
