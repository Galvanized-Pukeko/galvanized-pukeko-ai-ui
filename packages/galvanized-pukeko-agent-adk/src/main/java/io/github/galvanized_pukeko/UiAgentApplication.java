package io.github.galvanized_pukeko;

import com.google.adk.agents.BaseAgent;
import com.google.adk.agents.LlmAgent;
import com.google.adk.tools.FunctionTool;
import com.google.adk.web.AdkWebServer;
import com.google.adk.web.AgentLoader;
import com.google.common.collect.ImmutableList;
import io.github.galvanized_pukeko.config.McpConfiguration;
import io.github.galvanized_pukeko.config.McpToolsetFactory;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * Main application class for the UI Agent server. Extends AdkWebServer to inherit all ADK web
 * configuration including resource handlers, view controllers, and bean definitions. Also scans the
 * custom agent package for additional components.
 */
@SpringBootApplication(scanBasePackages = {
    "com.google.adk.web",        // Scan ADK web components
    "io.github.galvanized_pukeko"          // Scan custom agent components
})
public class UiAgentApplication extends AdkWebServer {

  public static void main(String[] args) {
    // Set WebSocket buffer size before starting the application
    System.setProperty(
        "org.apache.tomcat.websocket.DEFAULT_BUFFER_SIZE",
        String.valueOf(10 * 1024 * 1024)
    );

    SpringApplication.run(UiAgentApplication.class, args);
  }

  /**
   * Custom AgentLoader that creates the UI agent with MCP configuration from application.properties.
   * This bean takes precedence over the default CompiledAgentLoader.
   */
  @Bean
  @Primary
  public AgentLoader agentLoader(McpConfiguration mcpConfig, McpToolsetFactory mcpFactory) {
    return new AgentLoader() {
      @Override
      public ImmutableList<String> listAgents() {
        return ImmutableList.of("ui-agent");
      }

      @Override
      public BaseAgent loadAgent(String name) {
        if ("ui-agent".equals(name)) {
          return createUiAgent(mcpConfig, mcpFactory);
        }
        throw new NoSuchElementException("Agent not found: " + name);
      }
    };
  }

  /**
   * Creates the UI agent with MCP configuration from application.properties.
   */
  private LlmAgent createUiAgent(McpConfiguration mcpConfig, McpToolsetFactory mcpFactory) {
    List<Object> tools = new ArrayList<>();
    tools.add(FunctionTool.create(UiAgent.class, "renderForm"));
    tools.add(FunctionTool.create(UiAgent.class, "renderChart"));
    tools.add(FunctionTool.create(UiAgent.class, "renderTable"));
    
    // Add MCP toolset if configured in application.properties
    mcpFactory.create(mcpConfig).ifPresent(tools::add);
    
    return LlmAgent.builder()
        .name("ui-agent")
        .description("UI Agent that can render dynamic forms")
        .model("gemini-2.5-flash")
        .instruction(
            """
                You are a helpful assistant that can show forms to collect information from users.
                When you need to collect structured data, use the 'renderForm' tool to display a form.
                
                Example: If a user asks to fill out a contact form, use renderForm with components like:
                - {"type": "input", "label": "Name", "value": ""}
                - {"type": "input", "label": "Email", "value": ""}
                """
        )
        .tools(tools)
        .build();
  }
}
