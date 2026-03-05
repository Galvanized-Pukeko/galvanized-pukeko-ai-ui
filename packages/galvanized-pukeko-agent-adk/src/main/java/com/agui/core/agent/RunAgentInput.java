// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.agent;

import com.agui.core.context.Context;
import com.agui.core.message.BaseMessage;
import com.agui.core.state.State;
import com.agui.core.tool.Tool;

import java.util.List;

public record RunAgentInput(
    String threadId,
    String runId,
    State state,
    List<BaseMessage> messages,
    List<Tool> tools,
    List<Context> context,
    Object forwardedProps
) { }
