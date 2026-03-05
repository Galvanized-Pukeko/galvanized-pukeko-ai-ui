// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.function;

import java.util.Objects;

public record FunctionCall(String name, String arguments) {
    public FunctionCall {
        Objects.requireNonNull(name, "name cannot be null");
    }
}
