// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.message;

public enum Role {
    assistant("assistant"),
    developer("developer"),
    system("system"),
    tool("tool"),
    user("user")
    ;

    private String name;

    Role(final String name) {
        this.name = name;
    }
}
