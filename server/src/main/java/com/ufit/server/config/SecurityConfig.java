// src/main/java/com/ufit/server/config/SecurityConfig.java

package com.ufit.server.config;

import com.ufit.server.security.jwt.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
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
          // CORS & CSRF
          .cors(cors -> cors.configurationSource(corsConfigurationSource()))
          .csrf(csrf -> csrf.disable())

          // Stateless session
          .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

          // Disable default login/forms
          .httpBasic(basic -> basic.disable())
          .formLogin(form -> form.disable())

          // Authorization rules
          .authorizeHttpRequests(auth -> auth

            // Cho phép preflight
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

            // WebSocket/STOMP (nếu có)
            .requestMatchers("/ws-message/**").permitAll()

            // API public: news, info, health, v.v.
            .requestMatchers("/api/newsapi/**").permitAll()
            .requestMatchers("/api/info-news/**").permitAll()
            .requestMatchers("/api/home/**").permitAll()
            .requestMatchers("/api/diet/**").permitAll()
            .requestMatchers("/api/diseases/**").permitAll()
            .requestMatchers("/api/mental/**").permitAll()
            .requestMatchers("/api/health/**").permitAll()
            .requestMatchers("/api/articles/**").permitAll()
            .requestMatchers("/api/load-articles").permitAll()

            // Public forum: xem chủ đề và post
            .requestMatchers(HttpMethod.GET, "/api/forum/forum-categories").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/forum/topics/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/forum/posts/**").permitAll()

            // Report post: phải xác thực (ROLE_USER hoặc cao hơn)
            .requestMatchers(HttpMethod.POST, "/api/forum/posts/*/report").authenticated()

            // Tạo chủ đề, reply, vote (phải ROLE_USER)
            .requestMatchers(HttpMethod.POST, "/api/forum/topics").hasAuthority("ROLE_USER")
            .requestMatchers(HttpMethod.POST, "/api/forum/topics/*/reply").hasAuthority("ROLE_USER")
            .requestMatchers(HttpMethod.POST, "/api/forum/posts/*/reply").hasAuthority("ROLE_USER")
            .requestMatchers(HttpMethod.POST, "/api/forum/posts/*/vote").hasAuthority("ROLE_USER")

            // Authentication endpoints (login, register,…)
            .requestMatchers("/api/auth/**").permitAll()

            // Thông tin profile user
            .requestMatchers("/api/user/**").authenticated()

            // Chatbot & Plans chỉ cho ROLE_USER
            .requestMatchers("/api/chatbot/**").hasAuthority("ROLE_USER")
            .requestMatchers("/api/plans/**").hasAuthority("ROLE_USER")

            // Chat riêng (chat support)
            .requestMatchers("/api/chat/**").hasAnyAuthority("ROLE_USER", "ROLE_MODERATOR")

            // Moderator endpoints (role MODERATOR)
            .requestMatchers("/api/moderator/**").hasAuthority("ROLE_MODERATOR")
            .requestMatchers("/api/mod/reports/**").hasAuthority("ROLE_MODERATOR")

            // Admin endpoints (role ADMIN)
            .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
            .requestMatchers("/api/admin/reports/**").hasAuthority("ROLE_ADMIN")

            // Cho phép public tải file, ảnh (nếu có)
            .requestMatchers("/uploads/**").permitAll()

            // Bất kỳ request nào khác đều xác thực
            .anyRequest().authenticated()
          )

          // Thêm JWT filter vào trước UsernamePasswordAuthenticationFilter
          .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

          // Cho phép iframe same-origin (nếu dùng H2 console hoặc webview)
          .headers(h -> h.frameOptions(fo -> fo.sameOrigin()));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of("http://localhost:3000"));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setExposedHeaders(List.of("Authorization"));
        cfg.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
