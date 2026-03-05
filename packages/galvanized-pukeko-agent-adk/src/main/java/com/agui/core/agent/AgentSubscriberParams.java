// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.agent;

import com.agui.core.message.BaseMessage;
import com.agui.core.state.State;

import java.util.List;

public record AgentSubscriberParams(List<BaseMessage> messages, State state, Agent agent, RunAgentInput input) { }
