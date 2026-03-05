// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.event;

import com.agui.core.type.EventType;

public class TextMessageStartEvent extends BaseEvent {

    private String messageId;
    private String role;

    public TextMessageStartEvent() {
        super(EventType.TEXT_MESSAGE_START);
    }

    public void setMessageId(final String messageId) {
        this.messageId = messageId;
    }

    public String getMessageId() {
        return this.messageId;
    }

    public void setRole(final String role) {
        this.role = role;
    }

    public String getRole() {
        return this.role;
    }
}
