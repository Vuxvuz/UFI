package com.ufit.server.dto.response;

public class NewsApiArticleDto {
    private String title;
    private String description;
    private String url;
    private String urlToImage;
    private String publishedAt;
    private String source;

    public NewsApiArticleDto(String title, String description, String url, String urlToImage, String publishedAt, String source) {
        this.title = title;
        this.description = description;
        this.url = url;
        this.urlToImage = urlToImage;
        this.publishedAt = publishedAt;
        this.source = source;
    }

    // Getters
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getUrl() { return url; }
    public String getUrlToImage() { return urlToImage; }
    public String getPublishedAt() { return publishedAt; }
    public String getSource() { return source; }
}
