// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.stream;

public interface IEventStream<T> {

    void next(T item);

    void error(Throwable error);

    void complete();

    boolean isCancelled();

    void cancel();
}
