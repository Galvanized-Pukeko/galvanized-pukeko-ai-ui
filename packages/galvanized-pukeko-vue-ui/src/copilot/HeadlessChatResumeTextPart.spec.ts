import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HeadlessChat from './HeadlessChat.vue'

/**
 * QA-30: what `.text-part` → `element(s) not found` actually MEANS.
 *
 * The galvanized AG-UI e2e asserts that the agent resumes past a `capture_image` interrupt by
 * waiting for a non-empty assistant text part:
 *
 *   expect(page.locator('[data-testid="pk-headless-assistant"] .text-part').last())
 *     .not.toBeEmpty()
 *
 * Twice in five runs that assertion failed with `element(s) not found`, and the natural reading
 * of those words — the resume produced NO assistant text element at all — is wrong. It is the
 * reading this file exists to close off, because it sends the next person diagnosing the failure
 * after a resume bug that is not there.
 *
 * `HeadlessChat.vue` renders `.text-part` with `v-if="part.kind === 'text'"`, so the element does
 * not exist until a text part exists. While the resumed turn is still streaming its REASONING —
 * which is where most of the resume's latency lives, and whose length the model samples — there
 * is a tool-call badge, a thinking part, a live run, and nothing for that locator to match. So
 * `element(s) not found` is indistinguishable from "no assistant text YET", and cannot be
 * evidence that the resume emitted nothing.
 *
 * These are COMPONENT tests over a hand-built agent message log in the two states the e2e walks
 * through, using the `@copilotkit/vue/v2` mock pattern established by HeadlessChatA2UI.spec.ts.
 * The selector is a constant copied verbatim from the e2e spec, so renaming the class breaks this
 * test rather than silently turning the e2e assertion into one that can never match.
 */
const mocks = vi.hoisted(() => ({
  runAgent: vi.fn(),
  addMessage: vi.fn(),
  agentRef: { value: null as unknown as Record<string, unknown> },
}))

vi.mock('@copilotkit/vue/v2', () => ({
  useCopilotKit: () => ({ copilotkit: { value: { runAgent: mocks.runAgent } } }),
  useAgent: () => ({ agent: mocks.agentRef }),
}))

/** Copied verbatim from e2e/chat-gth-headless.spec.ts — the locator under discussion. */
const E2E_TEXT_PART_SELECTOR = '[data-testid="pk-headless-assistant"] .text-part'

/** The base64 image envelope the client tool hands back, abbreviated. */
const FRAME = JSON.stringify({ mimeType: 'image/jpeg', data: 'AAAA' })

/**
 * The message log MID-RESUME: the model called the tool, the client fulfilled it, and the
 * resumed turn has emitted reasoning but no answer text yet. This is the exact state the failing
 * e2e attempt was in — the page snapshot it saved shows a badge, streaming reasoning about the
 * frame, and the Stop button still up.
 */
function midResumeMessages() {
  return [
    { id: 'u1', role: 'user', content: 'Call the capture_image tool exactly once, then describe it.' },
    { id: 'r1', role: 'reasoning', content: 'The user wants me to call capture_image once.' },
    {
      id: 'a1',
      role: 'assistant',
      toolCalls: [{ id: 'tc-1', function: { name: 'capture_image', arguments: '{}' } }],
    },
    { id: 't1', role: 'tool', toolCallId: 'tc-1', content: FRAME },
    { id: 'r2', role: 'reasoning', content: 'The image is a solid green background with a circle' },
  ]
}

function setAgent(messages: unknown[], isRunning: boolean) {
  mocks.agentRef.value = {
    messages,
    addMessage: mocks.addMessage,
    abortRun: vi.fn(),
    setMessages: vi.fn(),
    isRunning,
  }
}

describe('QA-30: the resume text part and what its absence means', () => {
  it('renders NO text part while the resumed turn is still reasoning, though the run is alive', () => {
    setAgent(midResumeMessages(), true)
    const wrapper = mount(HeadlessChat, { props: { agentId: 'default', a2uiTarget: 'panel' } })

    // The locator the e2e waits on has nothing to match…
    expect(wrapper.findAll(E2E_TEXT_PART_SELECTOR)).toHaveLength(0)

    // …while every other sign says the round-trip is progressing normally: the tool call is
    // on screen, its result came back, the resumed turn is reasoning, and the run is running.
    // An `element(s) not found` here is therefore a statement about the CLOCK, not the resume.
    const badge = wrapper.find('.tool-call-badge')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('capture_image')
    expect(wrapper.find('[data-testid="pk-headless-assistant"] .thinking-part').exists()).toBe(true)
    expect(wrapper.find('.stop-button').exists()).toBe(true)
  })

  it('renders the text part as soon as the resumed turn emits answer text', () => {
    setAgent([...midResumeMessages(), { id: 'a2', role: 'assistant', content: 'A green test pattern.' }], false)
    const wrapper = mount(HeadlessChat, { props: { agentId: 'default', a2uiTarget: 'panel' } })

    const parts = wrapper.findAll(E2E_TEXT_PART_SELECTOR)
    expect(parts).toHaveLength(1)
    expect(parts[0].text()).toBe('A green test pattern.')
    // Non-empty is what the e2e asserts; pin the property rather than only the text.
    expect(parts[0].text().trim().length).toBeGreaterThan(0)
  })

  it('the tool call alone never produces a text part, so the assertion cannot pass on the tool turn', () => {
    // Guards the e2e assertion's MEANING: its locator is `.last()` over every assistant bubble,
    // so a preamble emitted before the tool call would satisfy it without the resume ever
    // happening. On this path the calling turn carries no content, so there is nothing to
    // satisfy it early — which is what makes the e2e assertion evidence about the resume.
    const callingTurnOnly = midResumeMessages().slice(0, 4)
    setAgent(callingTurnOnly, true)
    const wrapper = mount(HeadlessChat, { props: { agentId: 'default', a2uiTarget: 'panel' } })

    expect(wrapper.find('.tool-call-badge').exists()).toBe(true)
    expect(wrapper.findAll(E2E_TEXT_PART_SELECTOR)).toHaveLength(0)
  })
})
