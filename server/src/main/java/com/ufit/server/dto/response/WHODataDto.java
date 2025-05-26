package com.ufit.server.dto.response;

public class WHODataDto {
    private String id;
    private String title;
    private String description;
    private String publishedDate;
    private String link;

    public WHODataDto(String id, String title, String description, String publishedDate, String link) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.publishedDate = publishedDate;
        this.link = link;
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getPublishedDate() { return publishedDate; }
    public String getLink() { return link; }
}
