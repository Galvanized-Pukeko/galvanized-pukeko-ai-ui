package io.github.galvanized_pukeko.agui;

import com.agui.server.spring.AgUiParameters;
import com.agui.server.spring.AgUiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
public class AgUiController {

    private static final Logger log = LoggerFactory.getLogger(AgUiController.class);

    private final AgUiService agUiService;
    private final AdkLocalAgent adkLocalAgent;

    public AgUiController(AgUiService agUiService, AdkLocalAgent adkLocalAgent) {
        this.agUiService = agUiService;
        this.adkLocalAgent = adkLocalAgent;
    }

    @PostMapping(value = "/agents/{agentId}/run", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter runAgent(@PathVariable String agentId, @RequestBody AgUiParameters params) {
        log.info("AG-UI run request for agent: {}, threadId: {}", agentId, params.getThreadId());
        return agUiService.runAgent(adkLocalAgent, params);
    }
}
