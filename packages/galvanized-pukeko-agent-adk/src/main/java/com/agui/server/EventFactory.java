// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.server;

import com.agui.core.event.*;
import com.agui.core.message.Role;
import com.agui.core.state.State;

public class EventFactory {

    private EventFactory() { }

    public static RunStartedEvent runStartedEvent(final String threadId, final String runId) {
        var event = new RunStartedEvent();
        event.setThreadId(threadId);
        event.setRunId(runId);
        return event;
    }

    public static TextMessageStartEvent textMessageStartEvent(final String messageId, final String role) {
        var event = new TextMessageStartEvent();
        event.setMessageId(messageId);
        event.setRole(role);
        return event;
    }

    public static TextMessageContentEvent textMessageContentEvent(final String messageId, final String delta) {
        var event = new TextMessageContentEvent();
        event.setMessageId(messageId);
        event.setDelta(delta);
        return event;
    }

    public static TextMessageEndEvent textMessageEndEvent(final String messageId) {
        var event = new TextMessageEndEvent();
        event.setMessageId(messageId);
        return event;
    }

    public static RunFinishedEvent runFinishedEvent(String threadId, String runId) {
        var event = new RunFinishedEvent();
        event.setThreadId(threadId);
        event.setRunId(runId);
        return event;
    }

    public static ToolCallStartEvent toolCallStartEvent(String messageId, String name, String toolCallId) {
        var event = new ToolCallStartEvent();
        event.setParentMessageId(messageId);
        event.setToolCallName(name);
        event.setToolCallId(toolCallId);
        return event;
    }

    public static ToolCallArgsEvent toolCallArgsEvent(String arguments, String toolCallId) {
        var event = new ToolCallArgsEvent();
        event.setDelta(arguments);
        event.setToolCallId(toolCallId);
        return event;
    }

    public static ToolCallEndEvent toolCallEndEvent(String toolCallId) {
        var event = new ToolCallEndEvent();
        event.setToolCallId(toolCallId);
        return event;
    }

    public static RunErrorEvent runErrorEvent(String message) {
        var event = new RunErrorEvent();
        event.setError(message);
        return event;
    }

    public static ToolCallResultEvent toolCallResultEvent(String toolCallId, String content, String messageId, Role role) {
        var event = new ToolCallResultEvent();
        event.setToolCallId(toolCallId);
        event.setMessageId(messageId);
        event.setRole(role);
        event.setContent(content);
        return event;
    }

    public static StateSnapshotEvent stateSnapshotEvent(final State state) {
        var event = new StateSnapshotEvent();
        event.setState(state);
        return event;
    }
}
