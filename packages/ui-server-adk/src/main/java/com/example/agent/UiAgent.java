package com.example.agent;

import com.google.adk.agents.BaseAgent;
import com.google.adk.agents.LlmAgent;
import com.google.adk.tools.Annotations.Schema;
import com.google.adk.tools.FunctionTool;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;

@Configuration
public class UiAgent {

  private static final Logger log = LoggerFactory.getLogger(UiAgent.class);
  private static FormWebSocketHandler webSocketHandler;

  public UiAgent(FormWebSocketHandler handler) {
    webSocketHandler = handler;
  }

  @Bean
  public BaseAgent initAgent() {
    return LlmAgent.builder()
        .name("ui-agent")
        .description("UI Agent that can render dynamic forms")
        .instruction(
            """
            You are a helpful assistant that can show forms to collect information from users.
            When you need to collect structured data, use the 'renderForm' tool to display a form.
            
            Example: If a user asks to fill out a contact form, use renderForm with components like:
            - {"type": "input", "label": "Name", "value": ""}
            - {"type": "input", "label": "Email", "value": ""}
            """
        )
        .model("gemini-2.5-flash")
        .tools(FunctionTool.create(UiAgent.class, "renderForm"))
        .build();
  }

  /** Render a form in the UI */
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
}
