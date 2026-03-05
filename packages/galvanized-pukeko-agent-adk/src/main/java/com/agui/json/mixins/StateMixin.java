// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.json.mixins;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;

import java.util.Map;

public interface StateMixin {

    @JsonAnyGetter
    Map<String, Object> getState();

    @JsonAnySetter
    void set(String key, Object value);
}
