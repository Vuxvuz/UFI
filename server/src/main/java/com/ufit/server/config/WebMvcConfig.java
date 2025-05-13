package com.ufit.server.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Mọi request /uploads/** sẽ được ánh xạ đến thư mục file system ./uploads
        registry
          .addResourceHandler("/uploads/**")
          .addResourceLocations("file:uploads/");
    }
}
