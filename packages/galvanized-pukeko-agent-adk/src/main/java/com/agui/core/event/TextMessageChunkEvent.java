// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.event;

import com.agui.core.type.EventType;

public class TextMessageChunkEvent extends BaseEvent {

    private String messageId;
    private String role;
    private String delta;

    public TextMessageChunkEvent() {
        super(EventType.TEXT_MESSAGE_CHUNK);
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

    public void setDelta(final String delta) {
        this.delta = delta;
    }

    public String getDelta() {
        return this.delta;
    }
}
