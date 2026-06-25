package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.example.entity.AppUser;
import org.example.repository.AppUserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final AppUserRepository appUserRepository;

    @GetMapping("/profile")
    public ResponseEntity<Map<String, String>> getUserProfile(Authentication authentication) {
        String userEmail = authentication.getName();
        AppUser user = appUserRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Return a simple map with the user's email
        return ResponseEntity.ok(Map.of("email", user.getEmail()));
    }
}