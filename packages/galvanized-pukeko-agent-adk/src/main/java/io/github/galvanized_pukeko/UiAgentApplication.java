package io.github.galvanized_pukeko;

import com.google.adk.agents.BaseAgent;
import com.google.adk.agents.LlmAgent;
import com.google.adk.tools.FunctionTool;
import com.google.adk.web.AdkWebServer;
import com.google.adk.web.AgentLoader;
import com.google.common.collect.ImmutableList;
import io.github.galvanized_pukeko.config.A2aAgentFactory;
import io.github.galvanized_pukeko.config.A2aConfiguration;
import io.github.galvanized_pukeko.config.McpConfiguration;
import io.github.galvanized_pukeko.config.McpToolsetFactory;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Primary;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Main application class for the UI Agent server. Extends AdkWebServer to inherit all ADK web
 * configuration including resource handlers, view controllers, and bean definitions. Also scans the
 * custom agent package for additional components. AdkWebServer comes from adk-dev, we probably need
 * to create all our implementations to avoid including the entire adk-dev.
 */
@SpringBootApplication
@ComponentScan(
    basePackages = {
        "com.google.adk.web",        // Scan ADK web components
        "io.github.galvanized_pukeko"          // Scan custom agent components
    },
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = AdkWebServer.class
    )
)
public class UiAgentApplication extends AdkWebServer {

  private static final Logger log = LoggerFactory.getLogger(UiAgentApplication.class);

  @Override
  public void addViewControllers(
      org.springframework.web.servlet.config.annotation.ViewControllerRegistry registry) {
    log.info("addViewControllers");
    // Forward / to index.html so that the Vue app is served
    registry.addViewController("/").setViewName("forward:/index.html");
    // Redirect /dev-ui to / for backward compatibility
    // registry.addRedirectViewController("/dev-ui", "/");
  }

  public static void main(String[] args) {
    // Set WebSocket buffer size before starting the application
    System.setProperty(
        "org.apache.tomcat.websocket.DEFAULT_BUFFER_SIZE",
        String.valueOf(10 * 1024 * 1024)
    );

    SpringApplication.run(UiAgentApplication.class, args);
  }

  /**
   * Custom AgentLoader that creates the UI agent with MCP and A2A configuration from
   * application.properties. This bean takes precedence over the default CompiledAgentLoader.
   */
  @Bean
  @Primary
  public AgentLoader agentLoader(
      FormWebSocketHandler webSocketHandler,
      McpConfiguration mcpConfig,
      McpToolsetFactory mcpFactory,
      A2aConfiguration a2aConfig,
      A2aAgentFactory a2aFactory
  ) {
    log.info("creating agent loader");
    return new UiAgentLoader(webSocketHandler, mcpConfig, mcpFactory, a2aConfig, a2aFactory);
  }

  private static class UiAgentLoader implements AgentLoader {

    private LlmAgent uiAgent;

    public UiAgentLoader(FormWebSocketHandler webSocketHandler, McpConfiguration mcpConfig,
        McpToolsetFactory mcpFactory, A2aConfiguration a2aConfig, A2aAgentFactory a2aFactory) {
      this.uiAgent = UiAgent.createAgent(webSocketHandler, mcpConfig, mcpFactory, a2aConfig,
          a2aFactory);
    }

    @Override
    public ImmutableList<String> listAgents() {
      log.info("Listing agents...");

      return ImmutableList.of("pukeko-ui-agent");
    }

    @Override
    public BaseAgent loadAgent(String name) {
      log.info("Loading agent [{}]", name);
      if ("pukeko-ui-agent".equals(name)) {
        return uiAgent;
      }
      throw new NoSuchElementException("Agent not found: " + name);
    }
  }
}
