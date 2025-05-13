package com.ufit.demo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController

public class TestController {
    @GetMapping("/test")
    public String test() {
        return "UFit Server is running!";
    }
}