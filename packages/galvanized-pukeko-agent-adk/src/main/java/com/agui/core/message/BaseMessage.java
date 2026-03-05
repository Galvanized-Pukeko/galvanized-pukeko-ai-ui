// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.message;

import java.util.Objects;
import java.util.UUID;

public abstract class BaseMessage {

    private String id;
    private String content;
    private String name;

    protected BaseMessage() {
        this(UUID.randomUUID().toString(), "", "");
    }

    protected BaseMessage(final String id, final String content, final String name) {
        this.id = id;
        this.content = content;
        this.name = name;
    }

    public abstract Role getRole();

    public void setId(final String id) {
        this.id = id;
    }

    public String getId() {
        return this.id;
    }

    public void setContent(final String content) {
        this.content = content;
    }

    public String getContent() {
        return this.content;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public String getName() {
        return this.name;
    }

    @Override
    public boolean equals(final Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null || getClass() != obj.getClass()) {
            return false;
        }

        BaseMessage that = (BaseMessage) obj;

        if (!getRole().equals(that.getRole())) {
            return false;
        }
        if (!Objects.equals(id, that.id)) {
            return false;
        }
        return Objects.equals(content, that.content);
    }

    @Override
    public int hashCode() {
        int result = getRole().hashCode();
        result = 31 * result + (id != null ? id.hashCode() : 0);
        result = 31 * result + (content != null ? content.hashCode() : 0);
        return result;
    }
}
