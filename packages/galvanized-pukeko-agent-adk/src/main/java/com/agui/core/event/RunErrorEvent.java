// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.event;

import com.agui.core.type.EventType;

public class RunErrorEvent extends BaseEvent {

    private String error;

    public RunErrorEvent() {
        super(EventType.RUN_ERROR);
    }

    public void setError(final String error) {
        this.error = error;
    }

    public String getError() {
        return this.error;
    }
}
