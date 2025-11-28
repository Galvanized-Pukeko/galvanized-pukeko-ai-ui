package io.github.galvanized_pukeko.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "adk.ui")
public class UiConfigProperties {

  private String baseUrl = "http://localhost:8080";
  private String wsUrl = "ws://localhost:8080/ws";
  private String appName = "pukeko-ui-agent";

  public String getBaseUrl() {
    return baseUrl;
  }

  public void setBaseUrl(String baseUrl) {
    this.baseUrl = baseUrl;
  }

  public String getWsUrl() {
    return wsUrl;
  }

  public void setWsUrl(String wsUrl) {
    this.wsUrl = wsUrl;
  }

  public String getAppName() {
    return appName;
  }

  public void setAppName(String appName) {
    this.appName = appName;
  }

  @Override
  public String toString() {
    return "UiConfigProperties{" +
        "baseUrl='" + baseUrl + '\'' +
        ", wsUrl='" + wsUrl + '\'' +
        ", appName='" + appName + '\'' +
        '}';
  }
}
