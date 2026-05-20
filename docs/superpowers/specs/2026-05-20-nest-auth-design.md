# Nest Auth Service Design Spec

**Date:** 2026-05-20  
**Project:** nest-node-service

## Goal

Build a NestJS backend with username/password registration, login, and JWT-based authentication, connected to a local MySQL database.

## Decisions

| Area | Choice |
|------|--------|
| Database | MySQL (local) |
| ORM | TypeORM |
| Account identifier | Username + password |
| Auth | JWT Access Token (Bearer) |

## Architecture

```
src/
├── main.ts
├── app.module.ts
├── config/
├── users/          # User entity + CRUD service
└── auth/           # Register, login, JWT strategies, guards
```

## Data Model

**users** table:

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO | |
| username | VARCHAR(50) UNIQUE | 3-20 chars, alphanumeric + underscore |
| password | VARCHAR(255) | bcrypt hash |
| createdAt | DATETIME | |
| updatedAt | DATETIME | |

## API Endpoints

| Method | Path | Auth | Body/Response |
|--------|------|------|---------------|
| POST | /auth/register | No | `{ username, password }` → user (no password) |
| POST | /auth/login | No | `{ username, password }` → `{ access_token }` |
| GET | /auth/profile | JWT | → current user (no password) |

## Auth Flow

1. **Register:** validate DTO → check username unique → bcrypt hash → save → return user
2. **Login:** LocalStrategy validates credentials → JWT signed with `{ sub, username }` → return token
3. **Profile:** JwtAuthGuard → JwtStrategy extracts user → return profile

## Environment Variables

```
DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
JWT_SECRET, JWT_EXPIRES_IN
PORT
```

## Out of Scope

- Refresh tokens, email verification, password reset, RBAC, Docker

## Tech Stack

NestJS, TypeORM, mysql2, @nestjs/passport, passport-local, passport-jwt, @nestjs/jwt, bcrypt, class-validator
