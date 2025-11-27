package com.example.agent;

import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

public class ServiceAgentTest {

    @Test
    public void testRequestQuote() {
        Map<String, Object> quote = ServiceAgent.requestQuote(
            ServiceAgent.ServiceType.TSHIRT_PRINT,
            50,
            "Acme Corp",
            "Acme Rules",
            "Urgent"
        );

        assertEquals("Acme Corp", quote.get("businessName"));
        assertEquals(ServiceAgent.ServiceType.TSHIRT_PRINT, quote.get("serviceType"));
        assertEquals(50, quote.get("quantity"));
        assertEquals("Acme Rules", quote.get("text"));
        assertEquals("Urgent", quote.get("extraInfo"));
        assertEquals(20.0, quote.get("pricePerItem"));
        assertEquals(1000.0, quote.get("totalPrice"));
        assertEquals("QUOTE_GENERATED", quote.get("status"));
    }
}
