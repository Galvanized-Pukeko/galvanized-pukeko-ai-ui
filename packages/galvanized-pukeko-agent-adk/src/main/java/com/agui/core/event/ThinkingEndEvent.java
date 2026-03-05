// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.event;

import com.agui.core.type.EventType;

public class ThinkingEndEvent extends BaseEvent {

    public ThinkingEndEvent() {
        super(EventType.THINKING_END);
    }
}
