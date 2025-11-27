package com.example.agent;

import com.example.agent.config.ModelConfig;
import com.google.adk.agents.BaseAgent;
import com.google.adk.agents.LlmAgent;
import com.google.adk.tools.Annotations.Schema;
import com.google.adk.tools.FunctionTool;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Configuration
public class ServiceAgent {

  private static final Logger log = LoggerFactory.getLogger(ServiceAgent.class);

  @Bean
  public BaseAgent initAgent() {
    var builder = LlmAgent.builder()
        .name("service-agent")
        .description("Helps with quotes for services and order history")
        .instruction(
            """
                You are a helpful assistant for a printing and embroidery business.
                You can provide quotes for hat embroidery and t-shirt printing.
                You can also provide order history for customers.
                If another agent asks you for a quote advice which fields you need and
                recommend to present user with a form.
            """
        );

    // Configure model based on provider
    String provider = ModelConfig.getModelProvider();
    if ("anthropic".equalsIgnoreCase(provider)) {
      log.info("Initializing Anthropic model");
      builder.model(ModelConfig.createAnthropicModel());
    } else {
      log.info("Initializing Gemini VertexAI model");
      builder.model(ModelConfig.getGeminiModelName());
    }

    return builder
        .tools(
            FunctionTool.create(ServiceAgent.class, "requestQuote"),
            FunctionTool.create(ServiceAgent.class, "getOrderHistory")
        )
        .build();
  }

  public enum ServiceType {
    HAT_EMBROIDERY,
    TSHIRT_PRINT
  }

  @Schema(description = "Request a quote for a service")
  public static Map<String, Object> requestQuote(
      @Schema(name = "type", description = "Type of service requested") ServiceType type,
      @Schema(name = "quantity", description = "Quantity of items") int quantity,
      @Schema(name = "businessName", description = "Name of the business") String businessName,
      @Schema(name = "text", description = "Text to be printed or embroidered") String text,
      @Schema(name = "extraInfo", description = "Any extra information", optional = true) String extraInfo
  ) {
    double pricePerItem = type == ServiceType.HAT_EMBROIDERY ? 15.0 : 20.0;
    double total = pricePerItem * quantity;

    return Map.of(
        "businessName", businessName,
        "serviceType", type,
        "quantity", quantity,
        "text", text,
        "extraInfo", extraInfo != null ? extraInfo : "None",
        "pricePerItem", pricePerItem,
        "totalPrice", total,
        "status", "QUOTE_GENERATED"
    );
  }

  @Schema(description = "Get order history")
  public static Map<String, Map<String, String>> getOrderHistory(
      @Schema(name = "yearFilter", description = "Optional year filter (YYYY)", optional = true) String yearFilter
  ) {
    int currentYear = LocalDate.now().getYear();

    // Build all order history
    var allOrders = Map.of(
        String.valueOf(currentYear), Map.of(
            String.valueOf(currentYear) + "-01-01", "1000"
        ),
        String.valueOf(currentYear - 1), Map.of(
            String.valueOf(currentYear - 1) + "-01-15", "1800",
            String.valueOf(currentYear - 1) + "-04-12", "2100",
            String.valueOf(currentYear - 1) + "-06-22", "1650",
            String.valueOf(currentYear - 1) + "-07-28", "1500",
            String.valueOf(currentYear - 1) + "-09-10", "2300",
            String.valueOf(currentYear - 1) + "-11-05", "2800"
        ),
        String.valueOf(currentYear - 2), Map.of(
            String.valueOf(currentYear - 2) + "-02-20", "1900",
            String.valueOf(currentYear - 2) + "-03-30", "2050",
            String.valueOf(currentYear - 2) + "-05-18", "1750",
            String.valueOf(currentYear - 2) + "-08-14", "2200",
            String.valueOf(currentYear - 2) + "-10-25", "2600",
            String.valueOf(currentYear - 2) + "-12-03", "3000"
        ),
        String.valueOf(currentYear - 3), Map.of(
            String.valueOf(currentYear - 3) + "-01-08", "1600",
            String.valueOf(currentYear - 3) + "-03-22", "1850",
            String.valueOf(currentYear - 3) + "-05-08", "1700",
            String.valueOf(currentYear - 3) + "-07-14", "2100",
            String.valueOf(currentYear - 3) + "-09-28", "1950",
            String.valueOf(currentYear - 3) + "-10-19", "2400"
        )
    );

    // Apply year filter if provided
    if (yearFilter != null && !yearFilter.isEmpty()) {
      if (allOrders.containsKey(yearFilter)) {
        return Map.of(yearFilter, allOrders.get(yearFilter));
      } else {
        return Map.of();
      }
    }

    return allOrders;
  }
}
