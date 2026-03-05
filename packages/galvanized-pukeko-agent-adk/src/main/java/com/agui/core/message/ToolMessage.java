// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.message;

public class ToolMessage extends BaseMessage {

    private String toolCallId;
    private String error;

    public Role getRole() {
        return Role.tool;
    }

    public void setToolCallId(final String toolCallId) {
        this.toolCallId = toolCallId;
    }

    public String getToolCallId() {
        return this.toolCallId;
    }

    public void setError(final String error) {
        this.error = error;
    }

    public String getError() {
        return this.error;
    }
}
