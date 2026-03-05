// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.event;

import com.agui.core.state.State;
import com.agui.core.type.EventType;

public class StateSnapshotEvent extends BaseEvent {

    private State state;

    public StateSnapshotEvent() {
        super(EventType.STATE_SNAPSHOT);
    }

    public void setState(final State state) {
        this.state = state;
    }

    public State getState() {
        return state;
    }
}
