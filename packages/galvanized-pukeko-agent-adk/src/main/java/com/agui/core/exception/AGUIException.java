// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.exception;

public class AGUIException extends Exception {

    public AGUIException(final String message) {
        this(message, null);
    }

    public AGUIException(final String message, final Throwable cause) {
        super(message, cause);
    }
}
