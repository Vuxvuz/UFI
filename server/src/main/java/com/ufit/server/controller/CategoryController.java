// server/src/main/java/com/ufit/server/controller/CategoryController.java
package com.ufit.server.controller;

import com.ufit.server.entity.Category;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/forum/categories")
public class CategoryController {

    @GetMapping
    public List<Category> listCategories() {
        // Trả về ["NUTRITION","WORKOUT","SHOWOFF","GENERAL"]
        return Arrays.asList(Category.values());
    }
}
