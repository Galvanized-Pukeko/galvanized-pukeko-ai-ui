// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.event;

import com.agui.core.message.Role;
import com.agui.core.type.EventType;

public class ToolCallResultEvent extends BaseEvent {

    private String toolCallId;
    private String content;
    private String messageId;
    private Role role;

    public ToolCallResultEvent() {
        super(EventType.TOOL_CALL_RESULT);
    }

    public void setToolCallId(final String toolCallId) {
        this.toolCallId = toolCallId;
    }

    public String getToolCallId() {
        return this.toolCallId;
    }

    public void setContent(final String content) {
        this.content = content;
    }

    public String getContent() {
        return this.content;
    }

    public void setMessageId(final String messageId) {
        this.messageId = messageId;
    }

    public String getMessageId() {
        return this.messageId;
    }

    public void setRole(final Role role) {
        this.role = role;
    }

    public Role getRole() {
        return this.role;
    }
}
