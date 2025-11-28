package io.github.galvanized_pukeko;

import org.springframework.boot.SpringApplication;

public class DemoUiAgentApplication extends UiAgentApplication {

  public static void main(String[] args) {
    // Set WebSocket buffer size before starting the application
    System.setProperty(
        "org.apache.tomcat.websocket.DEFAULT_BUFFER_SIZE",
        String.valueOf(10 * 1024 * 1024)
    );

    SpringApplication.run(DemoUiAgentApplication.class, args);
  }

}