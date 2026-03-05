// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.tool;

import com.agui.core.function.FunctionCall;

import java.util.Objects;

public record ToolCall(String id, String type, FunctionCall function) {
    public ToolCall {
        Objects.requireNonNull(id, "id cannot be null");
        Objects.requireNonNull(type, "type cannot be null");
    }
}
