package io.github.galvanized_pukeko.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;

/**
 * Configuration properties for MCP (Model Context Protocol) server connection.
 * Supports three transport types: HTTP, SSE, and stdio.
 */
@Configuration
@ConfigurationProperties(prefix = "mcp")
public class McpConfiguration {

  /**
   * Whether MCP integration is enabled
   */
  private boolean enabled = false;

  /**
   * Full URL for the MCP server including protocol.
   * Examples:
   * - http://localhost:8081
   * - https://mcp-server.example.com:8443
   * - sse://localhost:8082
   * - stdio://npx
   */
  private String url = "http://localhost:8081";

  /**
   * JWT token for authentication (used for HTTP and SSE transports)
   */
  private String jwt;

  /**
   * Command to execute for stdio transport (e.g., "npx", "node")
   */
  private String command;

  /**
   * Arguments for the stdio command (e.g., ["-y", "@modelcontextprotocol/server-everything"])
   */
  private List<String> args;

  /**
   * Environment variables for stdio transport
   */
  private Map<String, String> env;

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

  public String getJwt() {
    return jwt;
  }

  public void setJwt(String jwt) {
    this.jwt = jwt;
  }

  public String getCommand() {
    return command;
  }

  public void setCommand(String command) {
    this.command = command;
  }

  public List<String> getArgs() {
    return args;
  }

  public void setArgs(List<String> args) {
    this.args = args;
  }

  public Map<String, String> getEnv() {
    return env;
  }

  public void setEnv(Map<String, String> env) {
    this.env = env;
  }
}
