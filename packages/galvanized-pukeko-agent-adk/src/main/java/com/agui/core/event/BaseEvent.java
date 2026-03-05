// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.event;

import com.agui.core.type.EventType;

import javax.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Objects;

public abstract class BaseEvent {

    private final EventType type;
    private long timestamp;
    private Object rawEvent;

    public BaseEvent(@NotNull final EventType type) {
        Objects.requireNonNull(type, "type cannot be null");
        this.type = type;
        this.timestamp = Instant.now().toEpochMilli();
    }

    public EventType getType() {
        return this.type;
    }

    public void setTimestamp(final long timestamp) {
        this.timestamp = timestamp;
    }

    public long getTimestamp() {
        return this.timestamp;
    }

    public void setRawEvent(final Object rawEvent) {
        this.rawEvent = rawEvent;
    }

    public Object getRawEvent() {
        return this.rawEvent;
    }
}
