# Dreamlands Development Guide

## Build & Run Commands
- `npm install` - Install dependencies
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run all tests
- `npm test -- -t "test name"` - Run specific test
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run typecheck` - Run TypeScript type checking

## Code Style Guidelines
- **Framework**: Phaser 3 for game rendering, Node.js/Express for backend
- **Types**: Use TypeScript with strict mode enabled
- **Formatting**: 2-space indentation, 80-character line limit
- **Naming**:
  - camelCase for variables, functions, methods
  - PascalCase for classes, interfaces, types
  - UPPER_SNAKE_CASE for constants
- **Imports**: Group imports (React, Phaser, project files)
- **Error Handling**: Use try/catch with specific error types
- **Game Assets**: 16x16 pixel art, 16-32 color palette
- **Documentation**: JSDoc comments for public APIs

## Repository Structure
- `/src` - Frontend game code
- `/server` - Node.js/Express backend
- `/assets` - Game assets (sprites, tiles, audio)
- `/tests` - Test files