// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.json;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.agui.core.event.BaseEvent;
import com.agui.core.message.BaseMessage;
import com.agui.core.state.State;
import com.agui.json.mixins.EventMixin;
import com.agui.json.mixins.MessageMixin;
import com.agui.json.mixins.StateMixin;

import java.util.Objects;

public class ObjectMapperFactory {

    private ObjectMapperFactory() { }

    public static void addMixins(final ObjectMapper objectMapper) {
        if (Objects.isNull(objectMapper.findMixInClassFor(BaseMessage.class))) {
            objectMapper.addMixIn(BaseMessage.class, MessageMixin.class);
        }
        if (Objects.isNull(objectMapper.findMixInClassFor(BaseEvent.class))) {
            objectMapper.addMixIn(BaseEvent.class, EventMixin.class);
        }
        if (Objects.isNull(objectMapper.findMixInClassFor(State.class))) {
            objectMapper.addMixIn(State.class, StateMixin.class);
        }
    }
}
