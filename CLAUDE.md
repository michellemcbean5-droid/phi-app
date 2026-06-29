# Claude Code Configuration

This file contains configuration and instructions for Claude Code when working with the PHI Mobile App.

## 🎯 Project Overview

**Project:** Prince Haul Intelligence (PHI) Mobile App
**Type:** Expo React Native + TypeScript
**Primary Platform:** Mobile (Android & iOS)
**Secondary Platform:** Web (optional)

## 📋 Project Structure

```
phi-app/
├── mobile/                          # Main mobile application
│   ├── App.tsx                     # Root component
│   ├── src/                        # Source code
│   │   ├── api/                    # API connectors
│   │   ├── assets/                 # Static assets & colors
│   │   ├── components/             # Reusable components
│   │   ├── middleware/             # Middleware (auth, etc.)
│   │   ├── navigation/             # Navigation setup
│   │   ├── screens/                # App screens
│   │   ├── store/                  # Zustand stores
│   │   ├── utils/                  # Utility functions
│   │   ├── workers/                # AI worker logic
│   │   └── __tests__/              # Unit tests
│   ├── app.json                    # Expo configuration
│   ├── eas.json                    # EAS build configuration
│   ├── package.json                # Dependencies & scripts
│   └── tsconfig.json               # TypeScript configuration
├── .github/                        # GitHub configuration
│   └── workflows/                  # CI/CD workflows
├── .gitignore                      # Git ignore rules
├── AGENTS.md                       # AI agents documentation
├── README.md                       # Project documentation
└── package.json                    # Root package.json (workspaces)
```

## 🚀 Quick Commands

### Development
```bash
# Install dependencies
cd mobile && npm install

# Start development server
cd mobile && npm start

# Run on Android
cd mobile && npm run android

# Run on iOS
cd mobile && npm run ios

# Run tests
cd mobile && npm test

# Type checking
cd mobile && npm run typecheck

# Linting
cd mobile && npm run lint

# Formatting
cd mobile && npm run format
```

## 🔧 Development Guidelines

### Code Style
- **TypeScript:** Strict typing, no `any` types
- **React:** Functional components with hooks
- **Naming:** camelCase for variables, PascalCase for components
- **Imports:** Grouped and alphabetized
- **Comments:** JSDoc for public APIs, inline for complex logic

### TypeScript Rules
- ✅ Always use explicit types
- ✅ No `any` types (use proper types or `unknown`)
- ✅ Use `zod` for runtime validation
- ✅ Use `as const` for constant objects
- ✅ Use type guards for type narrowing
- ❌ No type assertions (`as`) unless absolutely necessary
- ❌ No type ignoring (`// @ts-ignore`)

### React Native Best Practices
- ✅ Use `React.memo` for pure components
- ✅ Use `useCallback` for event handlers
- ✅ Use `useMemo` for expensive calculations
- ✅ Use `FlatList` for large lists
- ✅ Use `Image` with proper sizing
- ✅ Handle errors with ErrorBoundary
- ❌ Avoid inline styles (use StyleSheet.create)
- ❌ Avoid large components (break into smaller ones)

### Testing
- ✅ Test all utility functions
- ✅ Test all custom hooks
- ✅ Test all components (when possible)
- ✅ Test all stores
- ✅ Aim for 80%+ coverage
- ✅ Use descriptive test names
- ✅ Test edge cases

### Performance
- ✅ Memoize expensive computations
- ✅ Use lazy loading for heavy components
- ✅ Optimize images
- ✅ Minimize re-renders
- ✅ Use proper key props in lists
- ✅ Avoid unnecessary state updates

## 📊 Code Quality Standards

### ESLint Rules
- No unused variables
- No unused imports
- No console statements (use proper logging)
- No magic numbers
- No duplicate code
- Consistent code style

### Prettier Rules
- 2-space indentation
- Single quotes
- Semicolons at end of statements
- Trailing commas
- 80 character line limit

### Git Rules
- Descriptive commit messages
- Atomic commits (one change per commit)
- Proper branch naming (`feature/`, `fix/`, `refactor/`, etc.)
- Pull requests with descriptions
- Code reviews for all changes

## 🎯 Focus Areas for Improvement

### High Priority
1. **Type Safety:** Remove all `any` types
2. **Error Handling:** Add proper error boundaries
3. **Testing:** Increase test coverage to 80%+
4. **Performance:** Optimize slow components
5. **Accessibility:** Add accessibility features

### Medium Priority
1. **Documentation:** Add JSDoc comments
2. **Internationalization:** Add i18n support
3. **Analytics:** Add usage tracking
4. **Monitoring:** Add performance monitoring
5. **Offline Support:** Enhance offline capabilities

### Low Priority
1. **Animations:** Add smooth transitions
2. **Theming:** Add dark/light mode
3. **Localization:** Add multi-language support
4. **Customization:** Add user preferences
5. **Integration:** Add third-party integrations

## 🤖 AI Assistant Instructions

### When Working with This Codebase

#### Do:
- ✅ Follow existing code patterns and conventions
- ✅ Use TypeScript properly with explicit types
- ✅ Add tests for new functionality
- ✅ Update documentation when making changes
- ✅ Use the existing component library
- ✅ Follow the project structure
- ✅ Add proper error handling
- ✅ Use the brand color system

#### Don't:
- ❌ Use `any` types
- ❌ Add console.log statements
- ❌ Create large, monolithic components
- ❌ Ignore TypeScript errors
- ❌ Break existing functionality
- ❌ Add unnecessary dependencies
- ❌ Commit without testing

### Common Tasks

#### Adding a New Screen
1. Create file in `mobile/src/screens/NewScreen.tsx`
2. Add navigation type to `RootStackParamList`
3. Add screen to `RootNavigator.tsx`
4. Add route to navigation
5. Add tests in `mobile/src/__tests__/`

#### Adding a New Worker
1. Create file in `mobile/src/workers/NewWorker.ts`
2. Add worker definition to `workers-15x.ts`
3. Add worker to `WORKER_DEFINITIONS`
4. Add worker to store if needed
5. Add tests for worker logic

#### Adding a New API Connector
1. Create file in `mobile/src/api/newConnector.ts`
2. Define proper TypeScript interfaces
3. Add validation with Zod
4. Add error handling
5. Add tests for API functions

#### Adding a New Utility Function
1. Create file in `mobile/src/utils/newUtility.ts`
2. Add proper TypeScript types
3. Add validation if needed
4. Add comprehensive tests
5. Export from `utils/index.ts`

## 🔍 Debugging Tips

### Common Issues

#### TypeScript Errors
- **Problem:** Type errors in the code
- **Solution:** Run `npm run typecheck` to see all errors
- **Fix:** Add proper types or fix type mismatches

#### Build Errors
- **Problem:** Build fails with dependency errors
- **Solution:** Run `npm install` and `npm run clean`
- **Fix:** Check package.json for version conflicts

#### Runtime Errors
- **Problem:** App crashes at runtime
- **Solution:** Check error boundaries and console logs
- **Fix:** Add proper error handling and validation

#### Performance Issues
- **Problem:** App is slow or laggy
- **Solution:** Use React DevTools to profile components
- **Fix:** Optimize expensive operations with useMemo/useCallback

#### Navigation Issues
- **Problem:** Navigation not working properly
- **Solution:** Check route names and parameter types
- **Fix:** Ensure proper type definitions in navigation types

## 📚 Learning Resources

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Effective TypeScript](https://effectivetypescript.com/)

### React Native
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Native Best Practices](https://reactnative.dev/docs/performance)
- [React Native Patterns](https://github.com/franleplant/react-native-patterns)

### Expo
- [Expo Docs](https://docs.expo.dev/)
- [Expo GitHub](https://github.com/expo/expo)
- [Expo Examples](https://github.com/expo/expo/tree/main/apps/native-component-list)

### Testing
- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/)
- [Jest Docs](https://jestjs.io/docs/getting-started)

### State Management
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Zustand Examples](https://github.com/pmndrs/zustand/tree/main/examples)
- [React Query](https://react-query.tanstack.com/)

## 🎨 Design System

### Colors
Use the `PHI_COLORS` object from `mobile/src/assets/brandColors.ts`:

```typescript
import { PHI_COLORS } from '../assets/brandColors';

// Usage
<Text style={{ color: PHI_COLORS.royalBlue }}>Hello</Text>
<View style={{ backgroundColor: PHI_COLORS.surfaceDark }} />
```

### Typography
- **Headings:** `fontSize: 24-32`, `fontWeight: 'bold'`, `color: PHI_COLORS.white`
- **Body:** `fontSize: 16`, `color: PHI_COLORS.textPrimary`
- **Small Text:** `fontSize: 14`, `color: PHI_COLORS.textSecondary`
- **Buttons:** `fontSize: 16`, `fontWeight: '600'`, `color: PHI_COLORS.white`

### Spacing
- Use multiples of 4 for consistent spacing: `4, 8, 12, 16, 20, 24, 32, 48`
- Use `padding` and `margin` props for spacing

### Layout
- Use `Flexbox` for layout
- Use `SafeAreaView` for safe area insets
- Use `ScrollView` for scrollable content
- Use `FlatList` for large lists

## 🚀 Deployment Checklist

### Before Deployment
- [ ] All TypeScript errors resolved
- [ ] All tests passing
- [ ] All linting checks passing
- [ ] Code formatted with Prettier
- [ ] No console.log statements
- [ ] No `any` types
- [ ] Error boundaries in place
- [ ] Proper error handling
- [ ] Input validation
- [ ] Security checks
- [ ] Performance optimized
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped

### Deployment Steps
1. **Test on development:** `npm start`
2. **Test on staging:** Build and test on test devices
3. **Run all checks:** `npm run typecheck && npm run lint && npm run test`
4. **Build for production:** `npx eas build --platform android --profile production`
5. **Submit to stores:** `npx eas submit --platform android --profile production`
6. **Monitor:** Check error tracking and analytics

## 📞 Support

### Getting Help
- **Documentation:** Check README.md and AGENTS.md
- **Code Search:** Use `grep` or `rg` to find examples
- **TypeScript:** Use `tsc --noEmit` to check types
- **Debugging:** Use React DevTools and Flipper

### Common Questions

**Q: How do I add a new dependency?**
A: Add to `mobile/package.json`, then run `npm install`

**Q: How do I fix TypeScript errors?**
A: Run `npm run typecheck` and fix the reported errors

**Q: How do I test my changes?**
A: Run `npm test` for unit tests, `npm start` for manual testing

**Q: How do I format my code?**
A: Run `npm run format`

**Q: How do I check for linting errors?**
A: Run `npm run lint`

## 🎉 Success Criteria

### For New Features
- ✅ TypeScript types defined
- ✅ Tests written and passing
- ✅ Code follows project conventions
- ✅ Documentation updated
- ✅ No breaking changes
- ✅ Performance optimized

### For Bug Fixes
- ✅ Root cause identified
- ✅ Fix implemented
- ✅ Tests added to prevent regression
- ✅ Error handling improved
- ✅ Documentation updated

### For Refactoring
- ✅ Existing functionality preserved
- ✅ Code quality improved
- ✅ Tests still passing
- ✅ Performance maintained or improved
- ✅ Documentation updated

## 📝 Notes

- This project uses **Expo SDK 54** with **React Native 0.76.9**
- State management is handled by **Zustand**
- Navigation is handled by **React Navigation**
- Validation is handled by **Zod**
- Testing is handled by **Vitest**
- Formatting is handled by **Prettier**
- Linting is handled by **ESLint**

- The app is **mobile-first** with potential web support
- The primary platform is **Android** with iOS support
- The target audience is **truck drivers and dispatchers**

- Follow **TypeScript best practices**
- Follow **React Native best practices**
- Follow **mobile development best practices**
- Follow **accessibility guidelines**

---

**Last Updated:** June 2026
**Version:** 1.0.0
**Maintainer:** PHI Development Team
