// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.event;

import com.agui.core.type.EventType;

public class ThinkingTextMessageStartEvent extends BaseEvent {

    public ThinkingTextMessageStartEvent() {
        super(EventType.THINKING_TEXT_MESSAGE_START);
    }
}
