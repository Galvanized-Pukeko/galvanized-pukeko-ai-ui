// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.state;

import java.util.HashMap;
import java.util.Map;

public class State {

    private final Map<String, Object> stateMap;

    public State() {
        this(new HashMap<>());
    }

    public State(final Map<String, Object> stateMap) {
        this.stateMap = stateMap;
    }

    public void set(final String key, final Object value) {
        this.stateMap.put(key, value);
    }

    public Map<String, Object> getState() {
        return this.stateMap;
    }

    public Object get(final String key) {
        return this.stateMap.get(key);
    }

    public String toString() {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, Object> entry : stateMap.entrySet()) {
            if (!sb.isEmpty()) {
                sb.append("\n");
            }
            sb.append(entry.getKey()).append(": ").append(entry.getValue());
        }
        return sb.toString();
    }
}
