// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.context;

import javax.validation.constraints.NotNull;
import java.util.Objects;

public record Context(@NotNull String description, @NotNull String value) {

    public Context {
        Objects.requireNonNull(description, "description cannot be null");
        Objects.requireNonNull(value, "value cannot be null");
    }

    public String toString() {
        return "%s: %s".formatted(description, value);
    }
}
