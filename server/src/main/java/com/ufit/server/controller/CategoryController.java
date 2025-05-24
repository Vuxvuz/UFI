// server/src/main/java/com/ufit/server/controller/CategoryController.java
package com.ufit.server.controller;

import com.ufit.server.entity.Category;
import com.ufit.server.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/forum/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @GetMapping
    public List<Category> listCategories() {
        // Return all categories from the database instead of enum values
        return categoryService.getAllCategories();
    }
}
