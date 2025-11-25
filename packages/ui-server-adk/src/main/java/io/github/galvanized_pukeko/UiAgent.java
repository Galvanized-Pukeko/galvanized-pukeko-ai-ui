package io.github.galvanized_pukeko;

import com.google.adk.agents.LlmAgent;
import com.google.adk.tools.Annotations.Schema;
import com.google.adk.tools.FunctionTool;
import com.google.adk.tools.mcp.McpToolset;
import com.google.adk.tools.mcp.SseServerParameters;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

@Configuration
public class UiAgent {

  private static final Logger log = LoggerFactory.getLogger(UiAgent.class);
  private static FormWebSocketHandler webSocketHandler;

  public static final LlmAgent ROOT_AGENT;

  static {
    String jwt = System.getenv("PUKEKO_MCP_JWT");
    var builder = LlmAgent.builder()
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
        );

    java.util.List<Object> tools = new java.util.ArrayList<>();
    tools.add(FunctionTool.create(UiAgent.class, "renderForm"));
    tools.add(FunctionTool.create(UiAgent.class, "renderChart"));

    if (jwt != null && !jwt.isEmpty()) {
      log.info("PUKEKO_MCP_JWT found, adding MCP tools");
      SseServerParameters mcpServerParams = SseServerParameters.builder()
          .url("http://localhost:8081")
          .sseEndpoint("sse")
          .headers(Map.of("Authorization", "Bearer " + jwt))
          .build();
      tools.add(new McpToolset(mcpServerParams));
    } else {
      log.info("PUKEKO_MCP_JWT not found, skipping MCP tools");
    }

    ROOT_AGENT = builder.tools(tools).build();
  }

  public UiAgent(FormWebSocketHandler handler) {
    log.info("Initializing UI Agent");
    webSocketHandler = handler;
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
}
