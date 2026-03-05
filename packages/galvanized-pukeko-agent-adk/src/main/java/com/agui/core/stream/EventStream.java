// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven
package com.agui.core.stream;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;
import java.util.logging.Logger;

public class EventStream<T> implements IEventStream<T> {
    private final Consumer<T> onNext;
    private final Consumer<Throwable> onError;
    private final Runnable onComplete;
    private final AtomicBoolean cancelled = new AtomicBoolean(false);
    private final AtomicBoolean completed = new AtomicBoolean(false);
    private final Object lock = new Object();

    private final Logger logger = Logger.getLogger(EventStream.class.getName());

    public EventStream(
        Consumer<T> onNext,
        Consumer<Throwable> onError,
        Runnable onComplete
    ) {
        this.onNext = onNext;
        this.onError = onError;
        this.onComplete = onComplete;
    }

    @Override
    public void next(T item) {
        synchronized (lock) {
            if (cancelled.get() || completed.get() || onNext == null) {
                return;
            }

            try {
                onNext.accept(item);
            } catch (Exception e) {
                CompletableFuture.runAsync(() -> error(e));
            }
        }
    }

    @Override
    public void error(Throwable error) {
        synchronized (lock) {
            if (cancelled.get() || completed.get() || onError == null) {
                return;
            }

            completed.set(true);

            try {
                onError.accept(error);
            } catch (Exception e) {
                logger.severe("Error in error handler: " + e.getMessage());
                e.printStackTrace();
            }
        }
    }

    @Override
    public void complete() {
        synchronized (lock) {
            if (cancelled.get() || completed.getAndSet(true) || onComplete == null) {
                return;
            }

            try {
                onComplete.run();
            } catch (Exception e) {
                logger.severe("Error in complete handler: " + e.getMessage());
                e.printStackTrace();
            }
        }
    }

    @Override
    public boolean isCancelled() {
        return cancelled.get();
    }

    @Override
    public void cancel() {
        synchronized (lock) {
            cancelled.set(true);
        }
    }

    public boolean isCompleted() {
        return completed.get();
    }
}
