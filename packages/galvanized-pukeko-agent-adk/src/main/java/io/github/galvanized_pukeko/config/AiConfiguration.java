package io.github.galvanized_pukeko.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * AI configuration for the Pukeko agent.
 * Defaults are loaded from pukeko-defaults.properties via PukekoDefaultsConfiguration.
 */
@Component
@ConfigurationProperties(prefix = "pukeko.ai")
public class AiConfiguration {

  private String model;

  /**
   * Path to the agent prompt file (markdown).
   * Supports classpath: prefix for resources or file: prefix for external files.
   */
  private String promptPath;

  /**
   * Agent description used for agent identification and sub-agent delegation.
   */
  private String description;

  public String getModel() {
    return model;
  }

  public void setModel(String model) {
    this.model = model;
  }

  public String getPromptPath() {
    return promptPath;
  }

  public void setPromptPath(String promptPath) {
    this.promptPath = promptPath;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  @Override
  public String toString() {
    return "AiConfiguration{" +
        "model='" + model + '\'' +
        ", promptPath='" + promptPath + '\'' +
        ", description='" + description + '\'' +
        '}';
  }
}
