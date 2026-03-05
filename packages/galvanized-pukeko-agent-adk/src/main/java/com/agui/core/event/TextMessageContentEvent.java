// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.event;

import com.agui.core.type.EventType;

public class TextMessageContentEvent extends BaseEvent {

    private String messageId;
    private String delta;

    public TextMessageContentEvent() {
        super(EventType.TEXT_MESSAGE_CONTENT);
    }

    public void setMessageId(final String messageId) {
        this.messageId = messageId;
    }

    public String getMessageId() {
        return this.messageId;
    }

    public void setDelta(final String delta) {
        this.delta = delta;
    }

    public String getDelta() {
        return this.delta;
    }
}
