package com.ufit.server.service;

import com.ufit.server.entity.Category;
import java.util.List;

public interface CategoryService {
    List<Category> getAllCategories();
    Category addCategory(String name);
    void deleteCategory(String name);
    void updateCategoryName(String oldName, String newName);
} 