// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.agent;

import com.agui.core.message.BaseMessage;

import java.util.List;
import java.util.concurrent.CompletableFuture;

public interface Agent {

    CompletableFuture<Void> runAgent(RunAgentParameters parameters, AgentSubscriber subscriber);

    List<BaseMessage> getMessages();
}
