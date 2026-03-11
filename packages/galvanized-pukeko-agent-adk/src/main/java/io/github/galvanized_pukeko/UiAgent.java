package io.github.galvanized_pukeko;

import com.google.adk.agents.BaseAgent;
import com.google.adk.agents.LlmAgent;
import com.google.adk.tools.Annotations.Schema;
import com.google.adk.tools.FunctionTool;
import io.github.galvanized_pukeko.config.A2aAgentFactory;
import io.github.galvanized_pukeko.config.A2aConfiguration;
import io.github.galvanized_pukeko.config.AiConfiguration;
import io.github.galvanized_pukeko.config.McpConfiguration;
import io.github.galvanized_pukeko.config.McpToolsetFactory;
import io.github.galvanized_pukeko.config.PromptLoader;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class UiAgent {

  private static final Logger log = LoggerFactory.getLogger(UiAgent.class);
  public static final String PUKEKO_UI_AGENT_NAME = "pukeko-ui-agent";

  /**
   * Factory method to create the UI agent with MCP and A2A configurations.
   * This is called by UiAgentApplication's custom AgentLoader.
   *
   * @param aiConfig AI configuration from application.properties
   * @param mcpConfig MCP configuration from application.properties
   * @param mcpFactory Factory for creating MCP toolsets
   * @param a2aConfig A2A configuration from application.properties
   * @param a2aFactory Factory for creating A2A remote agents
   * @param promptLoader Loader for external prompt files
   * @return Configured LlmAgent with tools and sub-agents
   */
  public static LlmAgent createAgent(
      AiConfiguration aiConfig,
      McpConfiguration mcpConfig,
      McpToolsetFactory mcpFactory,
      A2aConfiguration a2aConfig,
      A2aAgentFactory a2aFactory,
      PromptLoader promptLoader
  ) {
    // Validate required configuration (should have been set by AiConfiguration from defaults if not configured)
    String description = aiConfig.getDescription();
    if (description == null || description.isBlank()) {
      throw new IllegalStateException(
          "pukeko.ai.description must be configured in application.properties or pukeko-defaults.properties");
    }

    log.info("Creating UI Agent with model '{}' and prompt path '{}'",
        aiConfig.getModel(), aiConfig.getPromptPath());
    log.info("Agent description: {}", description);

    // Load the agent prompt from configured path
    String instruction = promptLoader.loadPrompt(aiConfig.getPromptPath());

    // Build tools list
    List<Object> tools = new ArrayList<>();
    tools.add(FunctionTool.create(UiAgent.class, "showA2uiSurface"));

    // Add MCP toolset if configured
    mcpFactory.create(mcpConfig).ifPresent(toolset -> {
      log.info("Adding MCP toolset to UI Agent");
      tools.add(toolset);
    });

    // Build sub-agents list
    List<BaseAgent> subAgents = new ArrayList<>();

    // Add A2A remote agent if configured
    a2aFactory.create(a2aConfig).ifPresent(remoteAgent -> {
      log.info("Adding A2A remote agent '{}' to UI Agent", a2aConfig.getName());
      subAgents.add(remoteAgent);
    });

    // Build the agent
    var agentBuilder = LlmAgent.builder()
        .name(PUKEKO_UI_AGENT_NAME)
        .description(description)
        .model(aiConfig.getModel())
        .instruction(instruction)
        .tools(tools);

    // Only add subAgents if the list is not empty
    if (!subAgents.isEmpty()) {
      agentBuilder.subAgents(subAgents);
    }

    return agentBuilder.build();
  }

  /**
   * Display an A2UI surface to the user. The AG-UI streamer automatically emits the
   * surfaceJsonl content as TOOL_CALL_ARGS events, which the client renders.
   */
  @Schema(name = "show_a2ui_surface",
      description = "Display an A2UI surface to the user. Pass A2UI JSONL as surfaceJsonl "
      + "(newline-separated JSON objects: surfaceUpdate, optional dataModelUpdate, beginRendering).")
  public static Map<String, String> showA2uiSurface(
      @Schema(
          name = "surfaceJsonl",
          description = "A2UI JSONL content: newline-separated JSON objects describing the surface"
      ) String surfaceJsonl
  ) {
    log.info("show_a2ui_surface called with {} chars of JSONL", surfaceJsonl != null ? surfaceJsonl.length() : 0);
    return Map.of("status", "surface_rendered", "surfaceJsonl", surfaceJsonl != null ? surfaceJsonl : "");
  }
}
