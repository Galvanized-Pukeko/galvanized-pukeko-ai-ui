package io.github.galvanized_pukeko.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

/**
 * Loads library default properties with lowest priority.
 * Application's application.properties will override these values.
 *
 * The ignoreResourceNotFound=true ensures this doesn't fail if the file is missing.
 */
@Configuration
@PropertySource(
    value = "classpath:pukeko-defaults.properties",
    ignoreResourceNotFound = true
)
public class PukekoDefaultsConfiguration {
}
