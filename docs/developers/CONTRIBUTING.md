# CONTRIBUTING.md

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all.

## Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Add tests for new functionality
5. Commit your changes (`git commit -am 'Add feature'`)
6. Push to the branch (`git push origin feature/my-feature`)
7. Create a Pull Request

## Coding Standards

### Java/Backend

- Follow [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- Use meaningful variable and method names
- Add Javadoc comments for public methods
- Maximum line length: 100 characters
- Use Lombok to reduce boilerplate

### TypeScript/Frontend

- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use TypeScript for all new code
- Use functional components with hooks
- Add prop types and return types
- Maximum line length: 100 characters

## Testing Requirements

### Backend
- Unit tests for all service classes
- Integration tests for controllers
- Minimum 70% code coverage
- Run tests: `mvn test`

### Frontend
- Unit tests for all complex components
- Test user interactions
- Test state management (Redux)
- Run tests: `npm test`

## Commit Messages

Use clear, descriptive commit messages:

```
feat: Add user approval functionality
fix: Resolve email verification bug
docs: Update API documentation
style: Reformat auth service code
refactor: Extract email service
test: Add integration tests for user service
```

## Pull Request Process

1. Update documentation as needed
2. Add tests for new features
3. Ensure all tests pass locally
4. Provide a clear PR description
5. Link related issues
6. Be open to feedback and review comments

## Reporting Bugs

Include:
- Clear description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details
- Screenshots/logs

## Suggesting Enhancements

Include:
- Clear description of the enhancement
- Motivation and use case
- Possible implementation approach

## Questions?

Create a GitHub issue with the `question` label.
