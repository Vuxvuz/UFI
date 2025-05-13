// server/src/main/java/com/ufit/server/dto/request/ChatBotRequest.java
package com.ufit.server.dto.request;

public record ChatBotRequest(
    String message,
    Double height,
    Double weight,
    String aim,
    boolean previewPlan
) {}
