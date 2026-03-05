// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.server.spring;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.agui.json.ObjectMapperFactory;
import com.agui.server.streamer.AgentStreamer;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
@ConditionalOnClass({AgUiService.class, AgentStreamer.class})
public class AgUiAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public AgentStreamer agentStreamer() {
        return new AgentStreamer();
    }

    @Bean
    @ConditionalOnMissingBean
    public AgUiService agUiService(AgentStreamer agentStreamer, ObjectMapper objectMapper) {
        ObjectMapperFactory.addMixins(objectMapper);
        return new AgUiService(agentStreamer, objectMapper);
    }

    @Bean
    @ConditionalOnMissingBean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}
