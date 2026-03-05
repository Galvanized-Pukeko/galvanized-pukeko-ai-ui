// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.agent;

import com.agui.core.context.Context;
import com.agui.core.message.BaseMessage;
import com.agui.core.state.State;
import com.agui.core.tool.Tool;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class RunAgentParameters {
    private final String threadId;
    private final String runId;
    private final List<BaseMessage> messages;
    private final List<Tool> tools;
    private final List<Context> context;
    private final Object forwardedProps;
    private final State state;

    private RunAgentParameters(Builder builder) {
        this.threadId = builder.threadId;
        this.runId = builder.runId;
        this.messages = builder.messages;
        this.tools = Objects.isNull(builder.tools) ? new ArrayList<>() : builder.tools;
        this.context = Objects.isNull(builder.context) ? new ArrayList<>() : builder.context;
        this.forwardedProps = builder.forwardedProps;
        this.state = builder.state;
    }

    public String getThreadId() {
        return this.threadId;
    }

    public String getRunId() {
        return runId;
    }

    public List<BaseMessage> getMessages() {
        return this.messages;
    }

    public List<Tool> getTools() {
        return tools;
    }

    public List<Context> getContext() {
        return context;
    }

    public State getState() {
        return state;
    }

    public Object getForwardedProps() {
        return forwardedProps;
    }

    public static class Builder {
        private String threadId;
        private String runId;
        private List<BaseMessage> messages;
        private List<Tool> tools;
        private List<Context> context;
        private State state;
        private Object forwardedProps;

        public Builder threadId(String threadId) {
            this.threadId = threadId;
            return this;
        }

        public Builder runId(String runId) {
            this.runId = runId;
            return this;
        }

        public Builder messages(final List<BaseMessage> messages) {
            this.messages = messages;
            return this;
        }

        public Builder tools(List<Tool> tools) {
            this.tools = tools;
            return this;
        }

        public Builder context(List<Context> context) {
            this.context = context;
            return this;
        }

        public Builder state(State state) {
            this.state = state;
            return this;
        }

        public Builder forwardedProps(Object forwardedProps) {
            this.forwardedProps = forwardedProps;
            return this;
        }

        public RunAgentParameters build() {
            return new RunAgentParameters(this);
        }
    }

    public static Builder builder() {
        return new Builder();
    }

    public static RunAgentParameters empty() {
        return new Builder().build();
    }

    public static RunAgentParameters withRunId(String runId) {
        return new Builder().runId(runId).build();
    }
}
