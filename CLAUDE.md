# Claude Code Memory - Development Session

## Project Structure
- **API**: `serial-device-api/` - Node.js/Express backend with MQTT integration
- **Frontend**: `gesture-control-dashboard/` - React/TypeScript frontend
- **Database**: MongoDB with Mongoose models
- **MQTT**: External broker integration for real-time messaging

## Authentication System
- **JWT Tokens**: Required for ALL API endpoints except `/auth/register` and `/auth/login`
- **Global Auth Middleware**: Applied at `/api/index.ts` level - validates tokens before route handlers
- **Token Storage**: Frontend stores tokens in localStorage as `auth_token`
- **User Context**: Auth middleware sets `req.user` and `req.userId` from JWT validation

## MQTT Integration 
- **Two Message Sources**:
  1. HTTP API publishing (has JWT token + userId)
  2. External MQTT broker messages (no token - uses topic owner's userId)
- **Message Format**: HTTP API sends JSON payload: `{ message: "data", userId: "user-id" }`
- **Service Location**: `MqttService.ts` handles incoming MQTT messages and database saving
- **Topic Subscription**: Server loads all topics from database on startup and subscribes to MQTT broker

## Recent Fixes Applied
- **Global Token Authentication**: All API routes require JWT tokens (except auth endpoints)
- **Frontend Token Interceptors**: All repository axios instances automatically include tokens
- **MQTT userId Payload**: HTTP API now includes userId in MQTT message payload for proper database saving
- **Error Handling**: Added validation error responses and auth failure redirects

## Database Schema Requirements
- **TopicMessage**: Requires `userId` field (mandatory for database validation)
- **MqttTopic**: Has `userId` field for topic ownership
- **User**: Standard user model with authentication fields

## Important Notes
- **NO DATABASE MIGRATIONS**: User explicitly requested no database scripts or migrations
- **MQTT Payload Parsing**: Service handles both JSON (from API) and plain text (from external sources)
- **Authentication Workflow**: JWT token → `req.userId` → include in MQTT payload → extract for database saving
- **Error Patterns**: Missing userId causes MongoDB validation errors - fixed by including in payload

## Git Workflow & Commit Guidelines
- **Atomic Commits**: Each commit focuses on one logical change
- **No Personal Data**: Never include personal emails or names in commits
- **Commit Format**: Use conventional commits (feat:, fix:, etc.)
- **Recent Commits**: 
  - `37eca38` - fix: include userId in MQTT payload for proper message saving
  - `82d5016` - fix: allow publishing to all existing MQTT topics  
  - `2c7bece` - feat: add automatic token authentication to all frontend API calls
  - `df319f3` - feat: add global token authentication to all API routes

## Commands to Remember
- **API Start**: `cd serial-device-api && npm start`
- **Frontend Start**: `cd gesture-control-dashboard && npm start`
- **Test Authentication**: Check JWT token in browser localStorage
- **Git Status**: `git status` - check current changes
- **Git Commit**: Always use descriptive messages without personal data