package com.google.adk.webservice;

import io.a2a.spec.AgentCard;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
// WARNING a copy from https://github.com/google/adk-java/tree/main/a2a (due to lack of mvn package)
/** REST controller exposing A2A discovery endpoints. */
@RestController
@RequestMapping("/a2a")
public class AgentCardController {

  private static final Logger logger = LoggerFactory.getLogger(AgentCardController.class);

  private final A2ARemoteService service;

  public AgentCardController(A2ARemoteService service) {
    this.service = service;
  }

  @GetMapping(path = "/.well-known/agent-card.json", produces = "application/json")
  public AgentCard getAgentCard() {
    logger.debug("Received agent card request");
    return service.getAgentCard();
  }
}
