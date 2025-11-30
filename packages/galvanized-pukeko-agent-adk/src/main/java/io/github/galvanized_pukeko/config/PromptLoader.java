package io.github.galvanized_pukeko.config;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * Utility class for loading prompt files from various sources.
 * Supports classpath resources (classpath:) and file system paths (file:).
 * Resources loaded from classpath can be overridden by downstream applications.
 */
@Component
public class PromptLoader {

  private static final Logger log = LoggerFactory.getLogger(PromptLoader.class);
  private static final String CLASSPATH_PREFIX = "classpath:";
  private static final String FILE_PREFIX = "file:";

  /**
   * Load a prompt from the specified path.
   *
   * @param promptPath Path to the prompt file. Supports:
   *                   - classpath:path/to/file.md - Load from classpath (overridable by downstream apps)
   *                   - file:/absolute/path/to/file.md - Load from file system
   *                   - path/to/file.md - Treated as classpath: prefix
   * @return The prompt content
   * @throws UncheckedIOException if the prompt file cannot be loaded
   * @throws IllegalArgumentException if promptPath is null or blank
   */
  public String loadPrompt(String promptPath) {
    if (promptPath == null || promptPath.isBlank()) {
      throw new IllegalArgumentException("Prompt path must not be null or blank");
    }

    try {
      return loadPromptFromPath(promptPath);
    } catch (IOException e) {
      throw new UncheckedIOException("Failed to load prompt from '" + promptPath + "'", e);
    }
  }

  private String loadPromptFromPath(String promptPath) throws IOException {
    if (promptPath.startsWith(FILE_PREFIX)) {
      return loadFromFileSystem(promptPath.substring(FILE_PREFIX.length()));
    } else if (promptPath.startsWith(CLASSPATH_PREFIX)) {
      return loadFromClasspath(promptPath.substring(CLASSPATH_PREFIX.length()));
    } else {
      // Default to classpath if no prefix specified
      return loadFromClasspath(promptPath);
    }
  }

  private String loadFromClasspath(String resourcePath) throws IOException {
    ClassPathResource resource = new ClassPathResource(resourcePath);

    if (!resource.exists()) {
      throw new IOException("Classpath resource not found: " + resourcePath);
    }

    String resolvedPath = resource.getURL().toString();
    log.info("Loading agent prompt from classpath resource: {} (resolved to: {})", resourcePath, resolvedPath);

    try (InputStream is = resource.getInputStream()) {
      String content = new String(is.readAllBytes(), StandardCharsets.UTF_8);
      log.info("Successfully loaded prompt ({} characters) from: {}", content.length(), resolvedPath);
      return content;
    }
  }

  private String loadFromFileSystem(String filePath) throws IOException {
    Path path = Path.of(filePath);

    if (!Files.exists(path)) {
      throw new IOException("File not found: " + filePath);
    }

    log.info("Loading agent prompt from file system: {}", path.toAbsolutePath());

    String content = Files.readString(path, StandardCharsets.UTF_8);
    log.info("Successfully loaded prompt ({} characters) from file: {}", content.length(), path.toAbsolutePath());
    return content;
  }
}
