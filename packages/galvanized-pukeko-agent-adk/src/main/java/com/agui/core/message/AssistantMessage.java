// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.message;

import com.agui.core.tool.ToolCall;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class AssistantMessage extends BaseMessage {

    private List<ToolCall> toolCalls = new ArrayList<>();

    public Role getRole() {
        return Role.assistant;
    }

    public void setToolCalls(final List<ToolCall> toolCalls) {
        this.toolCalls = toolCalls;
    }

    public void addToolCall(final ToolCall toolCall) {
        if (Objects.isNull(this.toolCalls)) {
            this.toolCalls = new ArrayList<>();
        }
        this.toolCalls.add(toolCall);
    }

    public List<ToolCall> getToolCalls() {
        return this.toolCalls;
    }
}
