package com.google.adk.webservice;

import com.google.adk.a2a.A2ASendMessageExecutor;
import com.google.adk.agents.BaseAgent;
import io.a2a.spec.AgentCard;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;
import io.a2a.spec.AgentCapabilities;

/**
 * REST controller exposing A2A discovery endpoints.
 * Somehow ADK does not seem to expose this.
 */
@RestController
@RequestMapping("/a2a")
public class AgentCardController {

  private static final Logger logger = LoggerFactory.getLogger(AgentCardController.class);

  private final String appName;
  private final String appDescription;
  private final String appUrl;

  public AgentCardController(
      A2ASendMessageExecutor executor,
      BaseAgent agent,
      @Value("${a2a.remote.appUrl:http://localhost:8080/a2a/remote/v1/message:send}") String appUrl
  ) {
    this.appName = agent.name();
    this.appDescription = agent.description();
    this.appUrl = appUrl;
  }

  @GetMapping(path = "/.well-known/agent-card.json", produces = "application/json")
  public AgentCard getAgentCard() {
    logger.debug("Received agent card request");
    logger.debug("Generating agent card for {}", appName);

    // Define agent capabilities
    AgentCapabilities capabilities = new AgentCapabilities.Builder()
        .streaming(false)
        .pushNotifications(false)
        .stateTransitionHistory(false)
        .extensions(List.of())
        .build();

    return new AgentCard.Builder()
        .name(appName)
        .description(appDescription)
        .url(appUrl)
        .version("1.0.0")
        .capabilities(capabilities)
        .defaultInputModes(List.of("text"))
        .defaultOutputModes(List.of("text"))
        .skills(List.of())
        .build();
  }
}
