package com.ufit.server.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest req,
            @NonNull HttpServletResponse res,
            @NonNull FilterChain chain
    ) throws ServletException, IOException {
        String uri = req.getRequestURI();
        String header = req.getHeader("Authorization");

        logger.debug("[JWT] Filtering URI: {}", uri);
        logger.debug("[JWT] Authorization header: {}", header);

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                boolean valid = jwtService.isTokenValid(token);
                logger.debug("[JWT] Token valid? {}", valid);

                if (valid) {
                    String username = jwtService.extractUsername(token);
                    logger.debug("[JWT] Username: {}", username);

                    Claims claims = Jwts.parserBuilder()
                        .setSigningKey(jwtService.getSigningKey())
                        .build()
                        .parseClaimsJws(token)
                        .getBody();

                    @SuppressWarnings("unchecked")
                    List<String> roles = claims.get("roles", List.class);
                    logger.debug("[JWT] Roles: {}", roles);

                    List<GrantedAuthority> authorities = roles.stream()
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());

                    UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(username, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);

                    logger.debug("[JWT] Security context set for user: {}", username);
                }
            } catch (Exception ex) {
                logger.error("[JWT] Error processing token: {}", ex.getMessage());
            }
        } else {
            logger.debug("[JWT] No valid Authorization header found");
        }

        chain.doFilter(req, res);
    }
}
