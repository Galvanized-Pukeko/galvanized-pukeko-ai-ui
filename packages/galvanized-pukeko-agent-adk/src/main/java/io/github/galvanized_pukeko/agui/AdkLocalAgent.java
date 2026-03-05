package io.github.galvanized_pukeko.agui;

import com.agui.core.agent.AgentSubscriber;
import com.agui.core.agent.AgentSubscriberParams;
import com.agui.core.agent.RunAgentInput;
import com.agui.core.event.*;
import com.agui.core.message.Role;
import com.agui.core.state.State;
import com.agui.server.LocalAgent;
import com.google.adk.agents.RunConfig;
import com.google.adk.events.Event;
import com.google.adk.runner.Runner;
import com.google.adk.sessions.BaseSessionService;
import com.google.genai.types.Content;
import com.google.genai.types.Part;
import io.reactivex.rxjava3.core.Flowable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AdkLocalAgent extends LocalAgent {

    private static final Logger log = LoggerFactory.getLogger(AdkLocalAgent.class);

    private final Runner runner;
    private final String appName;
    private final BaseSessionService sessionService;

    public AdkLocalAgent(String agentId, Runner runner, String appName, BaseSessionService sessionService) throws com.agui.core.exception.AGUIException {
        super(agentId, new State(), new ArrayList<>());
        this.runner = runner;
        this.appName = appName;
        this.sessionService = sessionService;
    }

    @Override
    protected void run(RunAgentInput input, AgentSubscriber subscriber) {
        String threadId = input.threadId();
        String runId = input.runId();

        // Emit RUN_STARTED
        var runStarted = new RunStartedEvent();
        runStarted.setThreadId(threadId);
        runStarted.setRunId(runId);
        emitEvent(runStarted, subscriber);

        try {
            // Extract the last user message text
            String userText = "";
            if (input.messages() != null) {
                for (var msg : input.messages()) {
                    if (msg.getRole() == Role.user) {
                        userText = msg.getContent();
                    }
                }
            }

            if (userText.isEmpty()) {
                throw new RuntimeException("No user message found in AG-UI request");
            }

            // Use threadId as sessionId for consistency
            String userId = "user";
            String sessionId = threadId;

            // Build ADK Content from user message
            Content userContent = Content.fromParts(Part.fromText(userText));

            // Run the agent via ADK Runner — autoCreateSession will create if not exists
            RunConfig runConfig = RunConfig.builder()
                .setStreamingMode(RunConfig.StreamingMode.SSE)
                .setAutoCreateSession(true)
                .build();

            Flowable<Event> adkEvents = runner.runAsync(userId, sessionId, userContent, runConfig);

            // Translate ADK events to AG-UI events
            String messageId = UUID.randomUUID().toString();
            boolean messageStarted = false;

            for (Event adkEvent : adkEvents.blockingIterable()) {
                if (adkEvent.content().isPresent()) {
                    Content content = adkEvent.content().get();
                    if (content.parts().isPresent()) {
                        for (Part part : content.parts().get()) {
                            // Handle text parts from the model
                            if (part.text().isPresent() && !part.text().get().isEmpty()) {
                                String text = part.text().get();
                                String author = adkEvent.author();

                                // Only emit text from model/agent responses, not user echoes.
                                // Also skip the final consolidated ADK event (partial absent) —
                                // it duplicates the streaming chunks already emitted.
                                if (author != null && !author.equals("user")
                                        && adkEvent.partial().isPresent()) {
                                    if (!messageStarted) {
                                        var start = new TextMessageStartEvent();
                                        start.setMessageId(messageId);
                                        start.setRole("assistant");
                                        emitEvent(start, subscriber);
                                        messageStarted = true;
                                    }

                                    var contentEvent = new TextMessageContentEvent();
                                    contentEvent.setMessageId(messageId);
                                    contentEvent.setDelta(text);
                                    emitEvent(contentEvent, subscriber);
                                }
                            }

                            // Handle function calls (tool invocations)
                            if (part.functionCall().isPresent()) {
                                var fc = part.functionCall().get();
                                String toolCallId = fc.id().orElse(UUID.randomUUID().toString());

                                var toolStart = new ToolCallStartEvent();
                                toolStart.setToolCallId(toolCallId);
                                toolStart.setToolCallName(fc.name().orElse("unknown"));
                                if (messageStarted) {
                                    toolStart.setParentMessageId(messageId);
                                }
                                emitEvent(toolStart, subscriber);

                                // Emit tool args
                                if (fc.args().isPresent()) {
                                    var toolArgs = new ToolCallArgsEvent();
                                    toolArgs.setToolCallId(toolCallId);
                                    toolArgs.setDelta(fc.args().get().toString());
                                    emitEvent(toolArgs, subscriber);
                                }

                                var toolEnd = new ToolCallEndEvent();
                                toolEnd.setToolCallId(toolCallId);
                                emitEvent(toolEnd, subscriber);
                            }

                            // Handle function responses (tool results)
                            if (part.functionResponse().isPresent()) {
                                var fr = part.functionResponse().get();
                                String toolCallId = fr.id().orElse(UUID.randomUUID().toString());
                                var toolResult = new ToolCallResultEvent();
                                toolResult.setToolCallId(toolCallId);
                                toolResult.setContent(fr.response().isPresent() ? fr.response().get().toString() : "");
                                emitEvent(toolResult, subscriber);
                            }
                        }
                    }
                }
            }

            // End the text message if we started one
            if (messageStarted) {
                var end = new TextMessageEndEvent();
                end.setMessageId(messageId);
                emitEvent(end, subscriber);
            }

            // Emit RUN_FINISHED
            var runFinished = new RunFinishedEvent();
            runFinished.setThreadId(threadId);
            runFinished.setRunId(runId);
            emitEvent(runFinished, subscriber);

            // Signal completion
            subscriber.onRunFinalized(new AgentSubscriberParams(messages, this.state, this, input));

        } catch (Exception e) {
            log.error("Error during AG-UI agent run", e);
            var errorEvent = new RunErrorEvent();
            errorEvent.setError(e.getMessage());
            emitEvent(errorEvent, subscriber);
            subscriber.onRunFailed(new AgentSubscriberParams(messages, this.state, this, input), e);
        }
    }
}
