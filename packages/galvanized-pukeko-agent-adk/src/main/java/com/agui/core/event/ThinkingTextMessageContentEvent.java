// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.event;

import com.agui.core.type.EventType;

public class ThinkingTextMessageContentEvent extends BaseEvent {

    public ThinkingTextMessageContentEvent() {
        super(EventType.THINKING_TEXT_MESSAGE_CONTENT);
    }
}
