package io.github.galvanized_pukeko.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "pukeko.ai")
public class AiConfiguration {

  private String model = "gemini-2.5-pro";

  /**
   * Path to the agent prompt file (markdown).
   * Supports classpath: prefix for resources or file: prefix for external files.
   * Default: classpath:prompts/ui-agent-prompt.md
   */
  private String promptPath = "classpath:prompts/ui-agent-prompt.md";

  /**
   * Agent description used for agent identification and sub-agent delegation.
   * Required - must be configured in application.properties.
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
