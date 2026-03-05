// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.event;

import com.agui.core.message.BaseMessage;
import com.agui.core.type.EventType;

import java.util.ArrayList;
import java.util.List;

public class MessagesSnapshotEvent extends BaseEvent {

    private List<BaseMessage> messages = new ArrayList<>();

    public MessagesSnapshotEvent() {
        super(EventType.MESSAGES_SNAPSHOT);
    }

    public void setMessages(final List<BaseMessage> messages) {
        this.messages = messages;
    }

    public List<BaseMessage> getMessages() {
        return this.messages;
    }
}
