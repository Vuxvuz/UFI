package com.ufit.server.controller;

import com.ufit.server.dto.request.CategoryRequest;
import com.ufit.server.dto.response.ApiResponse;
import com.ufit.server.entity.Category;
import com.ufit.server.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Arrays;

@RestController
@RequestMapping("/api/admin/forum/categories")
public class CategoryManagementController {

    @Autowired
    private CategoryService categoryService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getAllCategories() {
        try {
            List<Category> categories = categoryService.getAllCategories();
            return ResponseEntity.ok(new ApiResponse<>("success", "Categories retrieved successfully", categories));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<Category>> addCategory(@RequestParam String name) {
        try {
            Category category = categoryService.addCategory(name);
            return ResponseEntity.ok(new ApiResponse<>("success", "Category added successfully", category));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }
    
    @PutMapping("/{name}")
    public ResponseEntity<ApiResponse<Void>> updateCategory(
            @PathVariable String name,
            @RequestParam String newName) {
        try {
            categoryService.updateCategoryName(name, newName);
            return ResponseEntity.ok(new ApiResponse<>("success", "Category updated successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }
    
    @DeleteMapping("/{name}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable String name) {
        try {
            categoryService.deleteCategory(name);
            return ResponseEntity.ok(new ApiResponse<>("success", "Category deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>("error", e.getMessage(), null));
        }
    }
}