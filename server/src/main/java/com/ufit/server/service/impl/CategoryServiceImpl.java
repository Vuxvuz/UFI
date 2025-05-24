package com.ufit.server.service.impl;

import com.ufit.server.entity.Category;
import com.ufit.server.repository.CategoryRepository;
import com.ufit.server.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Override
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Override
    public Category addCategory(String name) {
        // Check if category already exists
        if (categoryRepository.findByNameIgnoreCase(name).isPresent()) {
            throw new IllegalArgumentException("Category already exists: " + name);
        }
        
        Category category = new Category(name);
        return categoryRepository.save(category);
    }

    @Override
    @Transactional
    public void updateCategoryName(String oldName, String newName) {
        // Check if new name already exists
        if (categoryRepository.findByNameIgnoreCase(newName).isPresent()) {
            throw new IllegalArgumentException("Category name already exists: " + newName);
        }
        
        // Find the category to update
        Category category = categoryRepository.findByNameIgnoreCase(oldName)
            .orElseThrow(() -> new IllegalArgumentException("Category not found: " + oldName));
        
        category.setName(newName);
        categoryRepository.save(category);
    }

    @Override
    @Transactional
    public void deleteCategory(String name) {
        Category category = categoryRepository.findByNameIgnoreCase(name)
            .orElseThrow(() -> new IllegalArgumentException("Category not found: " + name));
        
        // You might want to check if there are topics in this category
        // before deletion or implement a migration strategy
        
        categoryRepository.delete(category);
    }
} 