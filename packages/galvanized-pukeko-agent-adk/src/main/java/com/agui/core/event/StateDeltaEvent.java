// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.event;

import com.agui.core.type.EventType;

public class StateDeltaEvent extends BaseEvent {

    public StateDeltaEvent() {
        super(EventType.STATE_DELTA);
    }
}
