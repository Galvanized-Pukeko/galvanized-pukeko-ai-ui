// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.tool;

import java.util.List;
import java.util.Map;
import java.util.Objects;

public record Tool(String name, String description, ToolParameters parameters) {
    public Tool {
        Objects.requireNonNull(name, "name cannot be null");
    }

    public record ToolParameters(String type, Map<String, ToolProperty> properties, List<String> required) { }

    public record ToolProperty(String type, String description) { }
}
