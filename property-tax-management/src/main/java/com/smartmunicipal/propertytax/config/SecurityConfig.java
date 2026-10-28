package com.smartmunicipal.propertytax.config;

import com.smartmunicipal.propertytax.security.CustomUserDetailsService;
import com.smartmunicipal.propertytax.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:8081}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
            .csrf(AbstractHttpConfigurer::disable)

            .cors(cors ->
                cors.configurationSource(corsConfigurationSource())
            )

            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            // Return 401 when the request is unauthenticated
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Authentication is required or the token is invalid\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"status\":403,\"error\":\"Forbidden\",\"message\":\"Access denied: insufficient permissions\"}");
                })
            )

            .authenticationProvider(authenticationProvider())

            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            )

            .authorizeHttpRequests(auth -> auth

                // Public authentication endpoints
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/auth/register",
                    "/api/auth/login",
                    "/api/auth/forgot-password",
                    "/api/auth/verify-reset-otp",
                    "/api/auth/reset-password"
                ).permitAll()

                // Actuator health
                .requestMatchers("/actuator/health")
                .permitAll()

                // Swagger / OpenAPI
                .requestMatchers(
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**"
                ).permitAll()

                // Analytics - accessible to authenticated users; controllers enforce role scoping
                .requestMatchers("/api/analytics/**")
                .authenticated()

                // Defaulters
                .requestMatchers("/api/defaulters/**")
                .hasAnyRole(
                    "COMMISSIONER",
                    "ADMIN",
                    "FINANCE_OFFICER",
                    "TAX_ASSESSOR"
                )

                // Grievances - submission and my list for authenticated users; municipal review for Admin/Commissioner
                .requestMatchers(HttpMethod.POST, "/api/grievances")
                .authenticated()
                .requestMatchers(HttpMethod.GET, "/api/grievances/my")
                .authenticated()
                .requestMatchers("/api/grievances/**")
                .hasAnyRole("ADMIN", "COMMISSIONER")

                // Assessments — both canonical and alias paths
                .requestMatchers(HttpMethod.POST, "/api/assessments/**", "/api/tax-assessments/**")
                .hasAnyRole(
                    "TAX_ASSESSOR",
                    "ADMIN",
                    "COMMISSIONER"
                )

                .requestMatchers(HttpMethod.GET, "/api/assessments/**", "/api/tax-assessments/**")
                .authenticated()

                .requestMatchers(HttpMethod.PUT, "/api/assessments/**", "/api/tax-assessments/**")
                .hasAnyRole(
                    "TAX_ASSESSOR",
                    "ADMIN",
                    "COMMISSIONER"
                )

                .requestMatchers(HttpMethod.DELETE, "/api/assessments/**", "/api/tax-assessments/**")
                .hasAnyRole(
                    "ADMIN",
                    "COMMISSIONER"
                )

                // Exemptions
                .requestMatchers("/api/exemptions/**")
                .hasAnyRole(
                    "FINANCE_OFFICER",
                    "ADMIN",
                    "COMMISSIONER"
                )

                // Notices
                .requestMatchers("/api/notices/**")
                .hasAnyRole(
                    "WARD_OFFICER",
                    "TAX_ASSESSOR",
                    "ADMIN",
                    "COMMISSIONER"
                )

                // NOC
                .requestMatchers("/api/noc/**")
                .authenticated()

                // Payments
                .requestMatchers("/api/payments/**")
                .authenticated()

                // Properties
                .requestMatchers("/api/properties/**")
                .authenticated()

                // User profile
                // Any authenticated user can access and update their own profile
                .requestMatchers("/api/users/profile")
                .authenticated()

                // User management
                .requestMatchers("/api/users/**")
                .hasRole("ADMIN")

                // Audit logs
                .requestMatchers("/api/audit/**")
                .hasRole("ADMIN")

                // Notifications
                .requestMatchers("/api/notifications/**")
                .authenticated()

                // Everything else
                .anyRequest()
                .authenticated()
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        // React frontend
        config.setAllowedOrigins(
            Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList()
        );

        config.setAllowedMethods(
            List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "PATCH",
                "OPTIONS"
            )
        );

        config.setAllowedHeaders(
            List.of(
                "Authorization",
                "Content-Type",
                "Accept"
            )
        );

        config.setExposedHeaders(
            List.of("Authorization")
        );

        config.setAllowCredentials(false);

        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
            "/**",
            config
        );

        return source;
    }
}