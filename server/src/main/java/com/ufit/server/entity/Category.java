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
}
