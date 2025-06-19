// server/src/main/java/com/ufit/server/config/WebSocketConfig.java
package com.ufit.server.config;

import com.ufit.server.security.jwt.JwtService;
import com.ufit.server.service.ChatMetricService;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;
    private final ChatMetricService chatMetricService;

    public WebSocketConfig(JwtService jwtService, ChatMetricService chatMetricService) {
        this.jwtService = jwtService;
        this.chatMetricService = chatMetricService;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry
            .addEndpoint("/ws-message")
            .setAllowedOrigins("http://localhost:3000", "http://localhost:8080")
            .withSockJS();

        registry
            .addEndpoint("/ws-webRTC")
            .setAllowedOrigins("http://localhost:3000", "http://localhost:8080")
            .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Xử lý authentication khi kết nối WebSocket
                    String authorizationHeader = getAuthorizationHeader(accessor);
                    System.out.println("WebSocket operation: " + accessor.getCommand() + " with headers: " + message.getHeaders());
                    System.out.println("Authorization header: " + authorizationHeader);

                    if (StringUtils.hasText(authorizationHeader) && authorizationHeader.startsWith("Bearer ")) {
                        String jwt = authorizationHeader.substring(7);
                        
                        // Kiểm tra JWT và set authentication cho WebSocket session
                        if (jwtService.isTokenValid(jwt)) {
                            String username = jwtService.extractUsername(jwt);
                            List<String> roles = jwtService.extractRoles(jwt);
                            
                            List<SimpleGrantedAuthority> authorities = roles.stream()
                                .map(SimpleGrantedAuthority::new)
                                .collect(Collectors.toList());
                            
                            UsernamePasswordAuthenticationToken authentication = 
                                new UsernamePasswordAuthenticationToken(username, null, authorities);
                            
                            // Set authentication vào StompHeaderAccessor
                            accessor.setUser(authentication);
                            // Set authentication vào SecurityContextHolder
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                            
                            System.out.println("WebSocket authenticated user: " + username + " with roles: " + authorities);
                            System.out.println("WebSocket authentication successful");
                        }
                    }
                }
                
                return message;
            }
        });
        
        // KHÔNG đăng ký CsrfChannelInterceptor ở đây, giúp vô hiệu hóa CSRF
    }

    private String getAuthorizationHeader(StompHeaderAccessor accessor) {
        // Trích xuất token từ header STOMP
        var nativeHeaders = accessor.getNativeHeader("Authorization");
        if (nativeHeaders != null && !nativeHeaders.isEmpty()) {
            return nativeHeaders.get(0);
        }
        return null;
    }
}
