// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.event;

import com.agui.core.type.EventType;

public class StepStartedEvent extends BaseEvent {

    private String stepName;

    public StepStartedEvent() {
        super(EventType.STEP_STARTED);
    }

    public void setStepName(final String stepName) {
        this.stepName = stepName;
    }

    public String getStepName() {
        return this.stepName;
    }
}
