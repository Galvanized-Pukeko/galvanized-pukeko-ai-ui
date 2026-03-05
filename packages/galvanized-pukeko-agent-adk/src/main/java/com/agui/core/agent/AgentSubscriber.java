// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.agent;

import com.agui.core.event.*;
import com.agui.core.message.BaseMessage;
import com.agui.core.state.State;
import com.agui.core.tool.ToolCall;

public interface AgentSubscriber {

    default void onRunInitialized(AgentSubscriberParams params) { }

    default void onRunFailed(AgentSubscriberParams params, Throwable error) { }

    default void onRunFinalized(AgentSubscriberParams params) { }

    default void onEvent(BaseEvent event) { }

    default void onRunStartedEvent(RunStartedEvent event) { }

    default void onRunFinishedEvent(RunFinishedEvent event) { }

    default void onRunErrorEvent(RunErrorEvent event) { }

    default void onStepStartedEvent(StepStartedEvent event) { }

    default void onStepFinishedEvent(StepFinishedEvent event) { }

    default void onTextMessageStartEvent(TextMessageStartEvent event) { }

    default void onTextMessageContentEvent(TextMessageContentEvent event) { }

    default void onTextMessageEndEvent(TextMessageEndEvent event) { }

    default void onToolCallStartEvent(ToolCallStartEvent event) { }

    default void onToolCallArgsEvent(ToolCallArgsEvent event) { }

    default void onToolCallEndEvent(ToolCallEndEvent event) { }

    default void onToolCallResultEvent(ToolCallResultEvent event) { }

    default void onStateSnapshotEvent(StateSnapshotEvent event) { }

    default void onStateDeltaEvent(StateDeltaEvent event) { }

    default void onMessagesSnapshotEvent(MessagesSnapshotEvent event) { }

    default void onRawEvent(RawEvent event) { }

    default void onCustomEvent(CustomEvent event) { }

    default void onMessagesChanged(AgentSubscriberParams params) { }

    default void onStateChanged(State state) { }

    default void onNewMessage(BaseMessage message) { }

    default void onNewToolCall(ToolCall toolCall) { }
}
