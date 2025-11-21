package com.example.agent;

import com.google.adk.agents.BaseAgent;
import com.google.adk.agents.LlmAgent;
import com.google.adk.tools.Annotations.Schema;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

public class HelloTimeAgent {

  private static final Logger log = LoggerFactory.getLogger(HelloTimeAgent.class);

  public static final BaseAgent ROOT_AGENT = initAgent();

  private static BaseAgent initAgent() {
    return LlmAgent.builder()
        .name("ui-agent")
        .description("UI Agent")
        .instruction(
            """
                You are a helpful assistant.
                """
        )
        .model("gemini-2.5-flash")
        .build();
  }

}
