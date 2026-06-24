package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.entity.AppUser;
import org.example.repository.AppUserRepository;
import org.example.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final AppUserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthenticationResponse register(RegisterRequest request) {
        var user = AppUser.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();
        repository.save(user);

        var userDetails = new User(user.getEmail(), user.getPasswordHash(), Collections.emptyList());
        var jwtToken = jwtUtil.generateToken(userDetails);
        
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow();
                
        var userDetails = new User(user.getEmail(), user.getPasswordHash(), Collections.emptyList());
        var jwtToken = jwtUtil.generateToken(userDetails);
        
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }
}
