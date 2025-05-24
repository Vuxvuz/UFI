package com.ufit.server.config;

import com.ufit.server.entity.Category;
import com.ufit.server.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private CategoryRepository categoryRepository;
    
    @Override
    public void run(String... args) throws Exception {
        // Only initialize if no categories exist
        if (categoryRepository.count() == 0) {
            List<String> defaultCategories = Arrays.asList(
                "NUTRITION", "WORKOUT", "SHOWOFF", "GENERAL"
            );
            
            for (String categoryName : defaultCategories) {
                categoryRepository.save(new Category(categoryName));
            }
            
            System.out.println("Default categories initialized!");
        }
    }
} 