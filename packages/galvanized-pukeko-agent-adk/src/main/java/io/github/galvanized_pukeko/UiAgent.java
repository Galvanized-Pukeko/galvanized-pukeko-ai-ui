package io.github.galvanized_pukeko;

import com.google.adk.agents.BaseAgent;
import com.google.adk.agents.LlmAgent;
import com.google.adk.tools.Annotations.Schema;
import com.google.adk.tools.FunctionTool;
import io.github.galvanized_pukeko.config.A2aAgentFactory;
import io.github.galvanized_pukeko.config.A2aConfiguration;
import io.github.galvanized_pukeko.config.McpConfiguration;
import io.github.galvanized_pukeko.config.McpToolsetFactory;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class UiAgent {

  private static final Logger log = LoggerFactory.getLogger(UiAgent.class);
  public static final String PUKEKO_UI_AGENT_NAME = "pukeko-ui-agent";
  private static FormWebSocketHandler webSocketHandler;

  /**
   * Factory method to create the UI agent with MCP and A2A configurations.
   * This is called by UiAgentApplication's custom AgentLoader.
   *
   * @param handler WebSocket handler for UI interactions
   * @param mcpConfig MCP configuration from application.properties
   * @param mcpFactory Factory for creating MCP toolsets
   * @param a2aConfig A2A configuration from application.properties
   * @param a2aFactory Factory for creating A2A remote agents
   * @return Configured LlmAgent with tools and sub-agents
   */
  public static LlmAgent createAgent(
      FormWebSocketHandler handler,
      McpConfiguration mcpConfig,
      McpToolsetFactory mcpFactory,
      A2aConfiguration a2aConfig,
      A2aAgentFactory a2aFactory
  ) {
    // Note this will actually not be loaded until you send first message.
    log.info("Creating UI Agent with MCP and A2A configurations");

    // Store handler statically for tools to access
    // TODO: Refactor tools to not rely on static state if possible, but for now this bridges the gap
    webSocketHandler = handler;
    
    // Build tools list
    List<Object> tools = new ArrayList<>();
    tools.add(FunctionTool.create(UiAgent.class, "renderForm"));
    tools.add(FunctionTool.create(UiAgent.class, "renderChart"));
    tools.add(FunctionTool.create(UiAgent.class, "renderTable"));
    
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
        .description("UI Agent that can render dynamic forms")
        .model("gemini-2.5-pro")
        .instruction(
            """
                You are a helpful assistant that can show forms to collect information from users.
                When you need to collect structured data, use the 'renderForm' tool to display a form.
                
                Example: If a user asks to fill out a contact form, use renderForm with components like:
                - {"type": "input", "label": "Name", "value": ""}
                - {"type": "input", "label": "Email", "value": ""}
                
                Use renderForm and renderTable tools eagerly whenever you have data to collect from users or to present to user.
                """
        )
        .tools(tools);
    
    // Only add subAgents if the list is not empty
    if (!subAgents.isEmpty()) {
      agentBuilder.subAgents(subAgents);
    }
    
    return agentBuilder.build();
  }

  /**
   * Render a form in the UI
   */
  @Schema(description = "Display a form to collect information from the user")
  public static Map<String, String> renderForm(
      @Schema(
          name = "components",
          description = "List of form components. Each component should have 'type' (input/select/checkbox), 'label', and optional 'value' or 'options'"
      ) List<Map<String, Object>> components,
      @Schema(
          name = "submitLabel",
          description = "Label for the submit button (default: Submit)"
      ) String submitLabel,
      @Schema(
          name = "cancelLabel",
          description = "Label for the cancel button (default: Cancel)"
      ) String cancelLabel
  ) {
    log.info("Rendering form with {} components", components.size());

    Map<String, Object> formData = Map.of(
        "components", components,
        "submitLabel", submitLabel != null ? submitLabel : "Submit",
        "cancelLabel", cancelLabel != null ? cancelLabel : "Cancel"
    );

    webSocketHandler.broadcastForm(formData);

    return Map.of("status", "Form rendered successfully");
  }

  /**
   * Render a chart in the UI
   */
  @Schema(description = "Display a chart to visualize data")
  public static Map<String, String> renderChart(
      @Schema(
          name = "chartType",
          description = "Type of chart to render (bar/pie)"
      ) String chartType,
      @Schema(
          name = "title",
          description = "Title of the chart"
      ) String title,
      @Schema(
          name = "data",
          description = "Chart data containing 'labels' (list of strings) and 'datasets' (list of objects with 'label' and 'data' (list of numbers))"
      ) Map<String, Object> data
  ) {
    log.info("Rendering {} chart: {}", chartType, title);

    Map<String, Object> chartData = Map.of(
        "chartType", chartType,
        "title", title,
        "data", data
    );

    webSocketHandler.broadcastChart(chartData);

    return Map.of("status", "Chart rendered successfully");
  }

  /**
   * Render a table in the UI
   */
  @Schema(description = "Display a table to present structured data in rows and columns. " +
      "Use this tool when you need to show tabular data, lists, or results from other tools. " +
      "Example: To show user data, use header=['Name', 'Age', 'Role'] and " +
      "data=[['John', '25', 'Engineer'], ['Jane', '30', 'Designer']] and footer=[]")
  public static Map<String, String> renderTable(
      @Schema(
          name = "caption",
          description = "Optional caption/title for the table (e.g., 'User Directory' or 'Sales Report Q4 2024')",
          optional = true
      ) String caption,
      @Schema(
          name = "header",
          description = "Optional list of header column names. Should match the number of columns in each data row. " +
              "Example: ['Name', 'Age', 'Department']",
          optional = true
      ) List<String> header,
      @Schema(
          name = "data",
          description = "Table data as a 2D array (list of rows, where each row is a list of cell values). " +
              "All values should be strings. Each row should have the same number of columns. " +
              "Example: [['John', '25', 'Engineering'], ['Jane', '30', 'Design'], ['Bob', '28', 'Marketing']]"
      ) List<List<String>> data,
      @Schema(
          name = "footer",
          description = "List of footer cell values (e.g., totals or summary data). " +
              "Example: ['Total', '83', '3 Employees']. Provide empty array if you don't need footer.",
          optional = true
      ) List<String> footer
  ) {
    log.info("Rendering table with {} rows", data != null ? data.size() : 0);

    java.util.Map<String, Object> tableData = new java.util.HashMap<>();
    if (caption != null) tableData.put("caption", caption);
    if (header != null) tableData.put("header", header);
    tableData.put("data", data);
    if (footer != null) tableData.put("footer", footer);

    webSocketHandler.broadcastTable(tableData);

    return Map.of("status", "Table rendered successfully");
  }
}
