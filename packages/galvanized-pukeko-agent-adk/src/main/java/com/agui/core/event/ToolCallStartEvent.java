// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.event;

import com.agui.core.type.EventType;

public class ToolCallStartEvent extends BaseEvent {

    private String toolCallId;
    private String toolCallName;
    private String parentMessageId;

    public ToolCallStartEvent() {
        super(EventType.TOOL_CALL_START);
    }

    public void setToolCallId(final String toolCallId) {
        this.toolCallId = toolCallId;
    }

    public String getToolCallId() {
        return this.toolCallId;
    }

    public void setToolCallName(final String toolCallName) {
        this.toolCallName = toolCallName;
    }

    public String getToolCallName() {
        return this.toolCallName;
    }

    public void setParentMessageId(final String parentMessageId) {
        this.parentMessageId = parentMessageId;
    }

    public String getParentMessageId() {
        return this.parentMessageId;
    }
}
