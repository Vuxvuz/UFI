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

            // Preflight
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

            // Forum: GET public, POST phải ROLE_USER
            .requestMatchers(HttpMethod.GET, "/api/forum/forum-categories").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/forum/topics/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/forum/posts/**").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/forum/topics").hasAuthority("ROLE_USER")

            // Authentication / public
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/topic/**").permitAll()

            // Profile – mọi user xác thực
            .requestMatchers("/api/user/**").authenticated()

            // Chatbot & plans – chỉ ROLE_USER
            .requestMatchers("/api/chatbot/**").hasAuthority("ROLE_USER")
            .requestMatchers("/api/plans/**").hasAuthority("ROLE_USER")

            // Moderator & admin
            .requestMatchers("/api/moderator/**").hasAuthority("ROLE_MODERATOR")
            .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")

            // Chat endpoints
            .requestMatchers("/api/chat/**").hasAnyAuthority("ROLE_USER", "ROLE_MODERATOR")

            // Public info sections
            .requestMatchers("/api/info-news/**").permitAll()
            .requestMatchers("/api/home/**").permitAll()
            .requestMatchers("/api/diet/**").permitAll()
            .requestMatchers("/api/diseases/**").permitAll()
            .requestMatchers("/api/mental/**").permitAll()
            .requestMatchers("/api/news/**").permitAll()
            .requestMatchers("/api/health/**").permitAll()
            .requestMatchers("/api/articles/**").permitAll()
            .requestMatchers("/api/load-articles").permitAll()
            .requestMatchers("/favicon.ico").permitAll()
            .requestMatchers("/api/who/**").permitAll()

            // Tất cả còn lại
            .anyRequest().authenticated()
          )

          // JWT filter
          .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

          // Cho phép iframe same-origin
          .headers(h -> h.frameOptions(fo -> fo.sameOrigin()));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of("http://localhost:3000"));
        cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setExposedHeaders(List.of("Authorization"));
        cfg.setAllowCredentials(true);

        var src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
