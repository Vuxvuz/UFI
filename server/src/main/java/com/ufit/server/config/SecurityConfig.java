// src/main/java/com/ufit/server/config/SecurityConfig.java

package com.ufit.server.config;

import com.ufit.server.security.jwt.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Enable CORS and disable CSRF (we use JWT, not cookie-based sessions)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable()) // Disable CSRF completely

            // Use stateless session; do not create or use an HTTP session
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Disable default login form and HTTP Basic auth
            .httpBasic(basic -> basic.disable())
            .formLogin(form -> form.disable())

            // Configure authorization rules
            .authorizeHttpRequests(auth -> auth

                // Allow preflight CORS requests without authentication
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // WebSocket/STOMP endpoints - allow all websocket connections
                // We'll handle authentication at the STOMP messaging level
                .requestMatchers("/ws-message/**").permitAll()
                .requestMatchers("/ws-webRTC/**").permitAll()

                // Public endpoints for news, info, health, etc.
                .requestMatchers("/api/newsapi/**").permitAll()
                .requestMatchers("/api/info-news/**").permitAll()
                .requestMatchers("/api/home/**").permitAll()
                .requestMatchers("/api/diet/**").permitAll()
                .requestMatchers("/api/diseases/**").permitAll()
                .requestMatchers("/api/mental/**").permitAll()
                .requestMatchers("/api/health/**").permitAll()
                .requestMatchers("/api/articles/**").permitAll()
                .requestMatchers("/api/load-articles").permitAll()

                // Public forum: viewing categories, topics, and posts
                .requestMatchers(HttpMethod.GET, "/api/forum/forum-categories").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/forum/topics/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/forum/posts/**").permitAll()

                // Reporting a post (must be authenticated)
                .requestMatchers(HttpMethod.POST, "/api/forum/posts/*/report").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/forum/articles/*/report").authenticated()

                // Creating topic, replying, voting (ROLE_USER or ROLE_MODERATOR required)
                .requestMatchers(HttpMethod.POST, "/api/forum/topics").hasAnyAuthority("ROLE_USER", "ROLE_MODERATOR")
                .requestMatchers(HttpMethod.POST, "/api/forum/topics/*/posts").hasAnyAuthority("ROLE_USER", "ROLE_MODERATOR")
                .requestMatchers(HttpMethod.POST, "/api/forum/topics/*/reply").hasAnyAuthority("ROLE_USER", "ROLE_MODERATOR")
                .requestMatchers(HttpMethod.POST, "/api/forum/posts/*/reply").hasAnyAuthority("ROLE_USER", "ROLE_MODERATOR")
                .requestMatchers(HttpMethod.POST, "/api/forum/*/*/vote").hasAnyAuthority("ROLE_USER", "ROLE_MODERATOR")

                // Authentication endpoints (login, register, etc.) are public
                .requestMatchers("/api/auth/**").permitAll()

                // User profile endpoints (must be authenticated)
                .requestMatchers("/api/user/**").authenticated()

                // Notification endpoints (must be authenticated)
                .requestMatchers("/api/notifications/**").authenticated()

                // Chatbot & subscription plan endpoints (ROLE_USER)
                .requestMatchers("/api/chatbot/**").hasAnyAuthority("ROLE_USER", "ROLE_ADMIN", "ROLE_MODERATOR")
                .requestMatchers("/api/plans/**").hasAnyAuthority("ROLE_USER", "ROLE_ADMIN", "ROLE_MODERATOR")

                // Chat support endpoints (ROLE_USER or ROLE_MODERATOR)
                .requestMatchers("/api/chat/**").hasAnyAuthority("ROLE_USER", "ROLE_MODERATOR")

                // Moderator endpoints (ROLE_MODERATOR)
                .requestMatchers("/api/moderator/**").hasAuthority("ROLE_MODERATOR")
                .requestMatchers("/api/mod/**").hasAuthority("ROLE_MODERATOR")
                .requestMatchers("/api/mod/reports/**").hasAuthority("ROLE_MODERATOR")

                // Admin endpoints (ROLE_ADMIN)
                .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers("/api/admin/reports/**").hasAuthority("ROLE_ADMIN")

                // Allow public access to uploaded files (if any)
                .requestMatchers("/uploads/**").permitAll()

                // All other requests require authentication
                .anyRequest().authenticated()
            )

            // Add the JWT authentication filter before UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

            // Allow same-origin frames (e.g., H2 console or embedded UIs)
            .headers(headers -> 
                headers.frameOptions(frame -> frame.sameOrigin())
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        // Allow specific origins for development
        cfg.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:8080"));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setExposedHeaders(List.of("Authorization"));
        cfg.setAllowCredentials(true); // Allow credentials
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
