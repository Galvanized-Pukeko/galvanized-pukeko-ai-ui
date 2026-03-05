// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.server;

import com.agui.core.agent.Agent;
import com.agui.core.agent.AgentSubscriber;
import com.agui.core.agent.RunAgentInput;
import com.agui.core.agent.RunAgentParameters;
import com.agui.core.context.Context;
import com.agui.core.event.*;
import com.agui.core.exception.AGUIException;
import com.agui.core.message.BaseMessage;
import com.agui.core.message.Role;
import com.agui.core.message.SystemMessage;
import com.agui.core.message.UserMessage;
import com.agui.core.state.State;

import java.util.*;
import java.util.concurrent.CompletableFuture;

public abstract class LocalAgent implements Agent {

    protected final String agentId;
    protected State state;
    protected List<BaseMessage> messages;

    public LocalAgent(
            final String agentId,
            final State state,
            final List<BaseMessage> messages
    ) throws AGUIException {
        this.agentId = agentId;
        this.state = state;
        this.messages = messages;
    }

    public String getAgentId() {
        return this.agentId;
    }

    public void setState(final State state) {
        this.state = state;
    }

    public List<BaseMessage> getMessages() {
        return this.messages;
    }

    @Override
    public CompletableFuture<Void> runAgent(RunAgentParameters parameters, AgentSubscriber subscriber) {
        CompletableFuture<Void> future = new CompletableFuture<>();

        var input = new RunAgentInput(
                parameters.getThreadId(),
                Objects.isNull(parameters.getRunId())
                        ? UUID.randomUUID().toString()
                        : parameters.getRunId(),
                Objects.nonNull(parameters.getState())
                        ? parameters.getState()
                        : this.state,
                parameters.getMessages(),
                parameters.getTools(),
                parameters.getContext(),
                parameters.getForwardedProps()
        );

        CompletableFuture.runAsync(() -> this.run(input, subscriber));

        return future;
    }

    protected abstract void run(RunAgentInput input, AgentSubscriber subscriber);

    protected void emitEvent(final BaseEvent event, final AgentSubscriber subscriber) {
        subscriber.onEvent(event);

        switch (event.getType()) {
            case RAW -> subscriber.onRawEvent((RawEvent) event);
            case CUSTOM -> subscriber.onCustomEvent((CustomEvent) event);
            case RUN_STARTED -> subscriber.onRunStartedEvent((RunStartedEvent) event);
            case RUN_ERROR -> subscriber.onRunErrorEvent((RunErrorEvent) event);
            case RUN_FINISHED -> subscriber.onRunFinishedEvent((RunFinishedEvent) event);
            case STEP_STARTED -> subscriber.onStepStartedEvent((StepStartedEvent) event);
            case STEP_FINISHED -> subscriber.onStepFinishedEvent((StepFinishedEvent) event);
            case TEXT_MESSAGE_START -> subscriber.onTextMessageStartEvent((TextMessageStartEvent) event);
            case TEXT_MESSAGE_CHUNK -> {
                var chunkEvent = (TextMessageChunkEvent) event;
                var textMessageContentEvent = new TextMessageContentEvent();
                textMessageContentEvent.setDelta(chunkEvent.getDelta());
                textMessageContentEvent.setMessageId(chunkEvent.getMessageId());
                textMessageContentEvent.setTimestamp(chunkEvent.getTimestamp());
                textMessageContentEvent.setRawEvent(chunkEvent.getRawEvent());
                subscriber.onTextMessageContentEvent(textMessageContentEvent);
            }
            case TEXT_MESSAGE_CONTENT -> subscriber.onTextMessageContentEvent((TextMessageContentEvent) event);
            case TEXT_MESSAGE_END -> subscriber.onTextMessageEndEvent((TextMessageEndEvent) event);
            case TOOL_CALL_START -> subscriber.onToolCallStartEvent((ToolCallStartEvent) event);
            case TOOL_CALL_ARGS -> subscriber.onToolCallArgsEvent((ToolCallArgsEvent) event);
            case TOOL_CALL_RESULT -> subscriber.onToolCallResultEvent((ToolCallResultEvent) event);
            case TOOL_CALL_END -> subscriber.onToolCallEndEvent((ToolCallEndEvent) event);
        }
    }

    protected SystemMessage createSystemMessage(final State state, final List<Context> context, final String systemMessageContent) {
        var message = """
%s

State:
%s

Context:
%s
"""
                .formatted(
                        systemMessageContent,
                        state,
                        String.join("\n",
                                context.stream().map(Context::toString)
                                        .toList()
                        )
                );

        var systemMessage = new SystemMessage();
        systemMessage.setId(UUID.randomUUID().toString());
        systemMessage.setContent(message);

        return systemMessage;
    }

    protected UserMessage getLatestUserMessage(List<BaseMessage> messages) throws AGUIException {
        return (UserMessage) messages.stream()
                .filter(m -> m.getRole().equals(Role.user))
                .reduce((a, b) -> b)
                .orElseThrow(() -> new AGUIException("No User Message found."));
    }

    protected void combineMessages(RunAgentInput input) {
        input.messages().forEach((message) -> {
            if (this.messages.stream().filter((m) -> m.getId().equals(message.getId())).findAny().isEmpty()) {
                this.messages.add(message);
            }
        });
    }
}
