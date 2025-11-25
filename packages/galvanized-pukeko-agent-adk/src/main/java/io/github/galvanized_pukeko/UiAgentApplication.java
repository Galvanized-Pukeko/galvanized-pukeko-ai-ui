package io.github.galvanized_pukeko;

import com.google.adk.web.AdkWebServer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.google.adk.agents.BaseAgent;
import com.google.adk.web.AgentLoader;
import com.google.common.collect.ImmutableList;
import java.util.List;
import java.util.NoSuchElementException;
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
}
