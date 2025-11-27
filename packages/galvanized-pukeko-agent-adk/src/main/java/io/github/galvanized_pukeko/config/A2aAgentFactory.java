package io.github.galvanized_pukeko.config;

import com.google.adk.a2a.RemoteA2AAgent;
import io.a2a.spec.AgentCapabilities;
import io.a2a.spec.AgentCard;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Factory for creating RemoteA2AAgent instances based on configuration.
 */
@Component
public class A2aAgentFactory {

  private static final Logger log = LoggerFactory.getLogger(A2aAgentFactory.class);

  /**
   * Creates a RemoteA2AAgent from the provided configuration.
   *
   * @param config A2A configuration
   * @return Optional containing RemoteA2AAgent if enabled and properly configured, empty otherwise
   */
  public Optional<RemoteA2AAgent> create(A2aConfiguration config) {
    if (!config.isEnabled()) {
      log.info("A2A is disabled");
      return Optional.empty();
    }

    if (config.getUrl() == null || config.getUrl().isEmpty()) {
      log.warn("A2A is enabled but URL is not configured");
      return Optional.empty();
    }

    if (config.getName() == null || config.getName().isEmpty()) {
      log.warn("A2A is enabled but name is not configured");
      return Optional.empty();
    }

    log.info("Creating RemoteA2AAgent for URL: {}", config.getUrl());

    try {
      // Create AgentCapabilities
      AgentCapabilities capabilities = new AgentCapabilities.Builder().build();

      // Create AgentCard with the remote agent's metadata
      // TODO this should be using well-known agent card
      AgentCard agentCard = new AgentCard.Builder()
          .url(config.getUrl())
          .name(config.getName())
          .version("0.0.1")
          .description(config.getDescription() != null ? config.getDescription() : "")
          .capabilities(capabilities)
          .defaultInputModes(List.of("text"))
          .defaultOutputModes(List.of("text"))
          .skills(List.of())
          .security(List.of())
          .build();

      // Build RemoteA2AAgent
      RemoteA2AAgent remoteAgent = RemoteA2AAgent.builder()
          .name(config.getName())
          .agentCardOrSource(agentCard)
          .description(config.getDescription() != null ? config.getDescription() : "")
          .build();

      log.info("Successfully created RemoteA2AAgent: {}", config.getName());
      return Optional.of(remoteAgent);

    } catch (Exception e) {
      log.error("Failed to create RemoteA2AAgent", e);
      return Optional.empty();
    }
  }
}
