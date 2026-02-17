# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React + TypeScript + Vite starter project with the React Compiler enabled.

## Common Commands

- `npm run dev` - Start development server with HMR
- `npm run build` - Type-check with `tsc -b` then build for production
- `npm run lint` - Run ESLint on the codebase
- `npm run preview` - Preview production build locally

## Key Technologies

- **React 19.2.0** - Using modern React features
- **Vite 7.3.1** - Fast build tool and dev server
- **TypeScript** - Strict mode enabled with comprehensive linting rules
- **React Compiler** - Experimental compiler enabled via `babel-plugin-react-compiler` in Vite config

## TypeScript Configuration

The project uses strict TypeScript settings including:
- `strict: true`
- `noUnusedLocals` and `noUnusedParameters` enabled
- `verbatimModuleSyntax` for explicit import/export types
- Module resolution set to "bundler" mode

## ESLint Configuration

Using ESLint flat config format with:
- TypeScript ESLint recommended rules
- React Hooks plugin with recommended rules
- React Refresh plugin for Vite

## React Compiler

The React Compiler is enabled in `vite.config.ts` through Babel. This experimental feature automatically optimizes React components. Note that this may impact dev and build performance.
