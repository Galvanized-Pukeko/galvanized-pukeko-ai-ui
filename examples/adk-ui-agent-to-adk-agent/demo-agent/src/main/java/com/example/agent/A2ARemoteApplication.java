package com.example.agent;

import com.google.adk.webservice.A2ARemoteConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;

/** Entry point for the standalone Spring Boot A2A service.
 * com.example.agent.A2ARemoteApplication
 * */
@SpringBootApplication
@Import(A2ARemoteConfiguration.class)
public class A2ARemoteApplication {

  public static void main(String[] args) {
    SpringApplication.run(A2ARemoteApplication.class, args);
  }
}
