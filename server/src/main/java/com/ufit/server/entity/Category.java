// server/src/main/java/com/ufit/server/entity/Category.java
package com.ufit.server.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "categories")
@Data
public class Category {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String name;
    
    // Default constructor required by JPA
    public Category() {}
    
    public Category(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }   

    public void setName(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @Override
    public String toString() {
        return "Category [id=" + id + ", name=" + name + "]";
    }

    
}
