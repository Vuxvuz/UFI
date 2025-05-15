package com.ufit.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.core.context.SecurityContextHolder;

@SpringBootApplication
public class UFitApplication {
    public static void main(String[] args) {
        SecurityContextHolder.setStrategyName(SecurityContextHolder.MODE_INHERITABLETHREADLOCAL);         // Cho phép thread con thừa kế SecurityContextHolder từ thread cha

        SpringApplication.run(UFitApplication.class, args);
    }
}