// package com.ufit.server.security.jwt;

// import io.jsonwebtoken.Claims;
// import io.jsonwebtoken.Jwts;
// import jakarta.servlet.FilterChain;
// import jakarta.servlet.ServletException;
// import jakarta.servlet.http.HttpServletRequest;
// import jakarta.servlet.http.HttpServletResponse;
// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;
// import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
// import org.springframework.security.core.GrantedAuthority;
// import org.springframework.security.core.authority.SimpleGrantedAuthority;
// import org.springframework.security.core.context.SecurityContextHolder;
// import org.springframework.stereotype.Component;
// import org.springframework.web.filter.OncePerRequestFilter;
// import org.springframework.lang.NonNull;

// import java.io.IOException;
// import java.util.List;
// import java.util.stream.Collectors;

// @Component
// public class JwtAuthenticationFilter extends OncePerRequestFilter {
//     private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
//     private final JwtService jwtService;

//     public JwtAuthenticationFilter(JwtService jwtService) {
//         this.jwtService = jwtService;
//     }

//     @Override
//     protected void doFilterInternal(
//             @NonNull HttpServletRequest req,
//             @NonNull HttpServletResponse res,
//             @NonNull FilterChain chain
//     ) throws ServletException, IOException {
//         String header = req.getHeader("Authorization");
//         logger.debug("[JWT-DEBUG] Authorization header: {}", header);
//         if (header != null && header.startsWith("Bearer ")) {
//             String token = header.substring(7);
//             if (jwtService.isTokenValid(token)) {
//                 String username = jwtService.extractUsername(token);
//                 Claims claims = Jwts.parserBuilder()
//                     .setSigningKey(jwtService.getSigningKey())
//                     .build()
//                     .parseClaimsJws(token)
//                     .getBody();
//                 @SuppressWarnings("unchecked")
//                 List<String> roles = claims.get("roles", List.class);
//                 List<GrantedAuthority> auths = roles.stream()
//                     .map(SimpleGrantedAuthority::new)
//                     .collect(Collectors.toList());
//                 UsernamePasswordAuthenticationToken auth =
//                     new UsernamePasswordAuthenticationToken(username, null, auths);
//                 SecurityContextHolder.getContext().setAuthentication(auth);
//             }
//         }
//         chain.doFilter(req, res);
//     }
// }


package com.ufit.server.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.lang.NonNull;

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
        //test
        logger.debug("[JWT] Filtering URI: {}", req.getRequestURI()); // xem no chan url nao
        String header = req.getHeader("Authorization");
        logger.debug("[JWT-DEBUG] Authorization header: {}", header);

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                boolean valid = jwtService.isTokenValid(token);
                logger.debug("[JWT-DEBUG] Token valid? {}", valid);

                if (valid) {
                    String username = jwtService.extractUsername(token);
                    logger.debug("[JWT-DEBUG] Username from token: {}", username);

                    Claims claims = Jwts.parserBuilder()
                        .setSigningKey(jwtService.getSigningKey())
                        .build()
                        .parseClaimsJws(token)
                        .getBody();

                    @SuppressWarnings("unchecked")
                    List<String> roles = claims.get("roles", List.class);
                    logger.debug("[JWT-DEBUG] Roles from token: {}", roles);

                    List<GrantedAuthority> auths = roles.stream()
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());

                    UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(username, null, auths);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    logger.debug("[JWT-DEBUG] Authentication set for user: {}", username);
                }
            } catch (Exception ex) {
                logger.error("[JWT-DEBUG] Error processing token:", ex);
            }
        }

        chain.doFilter(req, res);
    }
}
