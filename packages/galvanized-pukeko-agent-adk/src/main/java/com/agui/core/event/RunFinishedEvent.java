// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.event;

import com.agui.core.type.EventType;

public class RunFinishedEvent extends BaseEvent {

    private String threadId;
    private String runId;
    private Object result;

    public RunFinishedEvent() {
        super(EventType.RUN_FINISHED);
    }

    public void setThreadId(final String threadId) {
        this.threadId = threadId;
    }

    public String getThreadId() {
        return this.threadId;
    }

    public void setRunId(final String runId) {
        this.runId = runId;
    }

    public String getRunId() {
        return this.runId;
    }

    public void setResult(final Object result) {
        this.result = result;
    }

    public Object getResult() {
        return this.result;
    }
}
