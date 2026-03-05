// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.server.streamer;

import com.agui.core.agent.Agent;
import com.agui.core.agent.AgentSubscriber;
import com.agui.core.agent.AgentSubscriberParams;
import com.agui.core.agent.RunAgentParameters;
import com.agui.core.event.BaseEvent;
import com.agui.core.stream.EventStream;

public class AgentStreamer {

    public void streamEvents(final Agent agent, final RunAgentParameters parameters, final EventStream<BaseEvent> eventStream) {
        agent.runAgent(parameters, new AgentSubscriber() {
            @Override
            public void onEvent(BaseEvent event) {
                eventStream.next(event);
            }

            @Override
            public void onRunFinalized(AgentSubscriberParams params) {
                eventStream.complete();
            }

            @Override
            public void onRunFailed(AgentSubscriberParams params, Throwable throwable) {
                eventStream.error(throwable);
            }
        });
    }
}
