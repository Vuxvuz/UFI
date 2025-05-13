// server/src/main/java/com/ufit/server/dto/ChatMessage.java
package com.ufit.server.dto;

public class ChatMessage {
    private String sender;
    private String content;
    // getters + setters
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
