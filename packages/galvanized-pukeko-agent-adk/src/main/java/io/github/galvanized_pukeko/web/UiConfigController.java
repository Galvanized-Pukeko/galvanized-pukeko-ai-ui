package io.github.galvanized_pukeko.web;

import io.github.galvanized_pukeko.config.UiConfigProperties;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UiConfigController {

  private final UiConfigProperties properties;

  public UiConfigController(UiConfigProperties properties) {
    this.properties = properties;
  }

  @GetMapping("/config")
  public UiConfigProperties getConfig() {
    return properties;
  }
}
