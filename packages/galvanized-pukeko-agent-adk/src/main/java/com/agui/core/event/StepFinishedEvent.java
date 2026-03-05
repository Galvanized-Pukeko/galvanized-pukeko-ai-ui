// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.event;

import com.agui.core.type.EventType;

public class StepFinishedEvent extends BaseEvent {

    private String stepName;

    public StepFinishedEvent() {
        super(EventType.STEP_FINISHED);
    }

    public void setStepName(final String stepName) {
        this.stepName = stepName;
    }

    public String getStepName() {
        return this.stepName;
    }
}
