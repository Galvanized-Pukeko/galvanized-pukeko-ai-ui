package io.github.galvanized_pukeko.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "pukeko.ai")
public class AiConfiguration {

  private String model = "gemini-2.5-pro";

  public String getModel() {
    return model;
  }

  public void setModel(String model) {
    this.model = model;
  }

  @Override
  public String toString() {
    return "AiConfiguration{" +
        "model='" + model + '\'' +
        '}';
  }
}
