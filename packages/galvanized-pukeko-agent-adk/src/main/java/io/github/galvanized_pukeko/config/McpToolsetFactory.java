package io.github.galvanized_pukeko.config;

import com.google.adk.tools.mcp.McpToolset;
import com.google.adk.tools.mcp.SseServerParameters;
import com.google.adk.tools.mcp.StdioServerParameters;
import com.google.adk.tools.mcp.StreamableHttpServerParameters;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Factory for creating MCP toolsets based on configuration.
 * Supports three transport types: HTTP, SSE, and stdio.
 * TODO add support for multiple MCP servers
 */
@Component
public class McpToolsetFactory {

  private static final Logger log = LoggerFactory.getLogger(McpToolsetFactory.class);

  /**
   * Creates an MCP toolset from the provided configuration.
   *
   * @param config MCP configuration
   * @return Optional containing McpToolset if enabled and properly configured, empty otherwise
   */
  public Optional<McpToolset> create(McpConfiguration config) {
    if (!config.isEnabled()) {
      log.info("MCP is disabled");
      return Optional.empty();
    }

    if (config.getUrl() == null || config.getUrl().isEmpty()) {
      log.warn("MCP is enabled but URL is not configured");
      return Optional.empty();
    }

    String url = config.getUrl();
    log.info("Creating MCP toolset for URL: {}", url);

    try {
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return createHttpToolset(config);
      } else if (url.startsWith("sse://")) {
        return createSseToolset(config);
      } else if (url.startsWith("stdio://")) {
        return createStdioToolset(config);
      } else {
        log.error("Unsupported MCP transport protocol in URL: {}. Supported protocols: http://, https://, sse://, stdio://", url);
        return Optional.empty();
      }
    } catch (Exception e) {
      log.error("Failed to create MCP toolset", e);
      return Optional.empty();
    }
  }

  /**
   * Creates an MCP toolset using HTTP transport.
   */
  private Optional<McpToolset> createHttpToolset(McpConfiguration config) {
    log.info("Creating HTTP MCP toolset");
    
    var builder = StreamableHttpServerParameters.builder(config.getUrl());
    
    // Add JWT authentication header if provided
    if (config.getJwt() != null && !config.getJwt().isEmpty()) {
      builder.headers(Map.of("Authorization", "Bearer " + config.getJwt()));
    }
    
    StreamableHttpServerParameters params = builder.build();
    return Optional.of(new McpToolset(params));
  }

  /**
   * Creates an MCP toolset using SSE transport.
   */
  private Optional<McpToolset> createSseToolset(McpConfiguration config) {
    log.info("Creating SSE MCP toolset");
    
    // Convert sse:// to http:// for the actual connection
    String httpUrl = config.getUrl().replaceFirst("^sse://", "http://");
    
    var builder = SseServerParameters.builder()
        .url(httpUrl);
    
    // Add JWT authentication header if provided
    if (config.getJwt() != null && !config.getJwt().isEmpty()) {
      Map<String, Object> headers = new HashMap<>();
      headers.put("Authorization", "Bearer " + config.getJwt());
      builder.headers(headers);
    }
    
    SseServerParameters params = builder.build();
    return Optional.of(new McpToolset(params));
  }

  /**
   * Creates an MCP toolset using stdio transport.
   */
  private Optional<McpToolset> createStdioToolset(McpConfiguration config) {
    log.info("Creating stdio MCP toolset");
    
    if (config.getCommand() == null || config.getCommand().isEmpty()) {
      log.error("stdio transport requires mcp.command to be configured");
      return Optional.empty();
    }
    
    var builder = StdioServerParameters.builder()
        .command(config.getCommand());
    
    // Add arguments if provided
    if (config.getArgs() != null && !config.getArgs().isEmpty()) {
      builder.args(config.getArgs());
    }
    
    // Add environment variables if provided
    if (config.getEnv() != null && !config.getEnv().isEmpty()) {
      builder.env(config.getEnv());
    }
    
    StdioServerParameters stdioParams = builder.build();
    // Convert to ServerParameters for McpToolset
    return Optional.of(new McpToolset(stdioParams.toServerParameters()));
  }
}
