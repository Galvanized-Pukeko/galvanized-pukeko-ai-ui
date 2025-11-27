package io.github.galvanized_pukeko.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for A2A (Agent-to-Agent) connection.
 * Enables connecting to remote A2A agents via HTTP.
 */
@Configuration
@ConfigurationProperties(prefix = "a2a")
public class A2aConfiguration {

  /**
   * Whether A2A integration is enabled
   */
  private boolean enabled = false;

  /**
   * URL of the remote A2A agent endpoint.
   * Example: http://localhost:8082/a2a/remote
   */
  private String url = "http://localhost:8082/a2a/remote";

  /**
   * Name for the remote agent (used in agent hierarchy)
   */
  private String name = "remote-agent";

  /**
   * Optional description of the remote agent
   */
  private String description = "Remote A2A agent";

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public String getUrl() {
    return url;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }
}
