# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-02-15

### Changed
- **Rename**: Project renamed from `uepapy-checkout-integration` to `uepapay-checkout-integration-sdk`.
- **Repository**: Updated repository URLs and metadata in `package.json`.
- **Docs**: Updated README instructions for the new package name.

## [1.0.0] - 2026-02-13

### Added
- **Core Engine**: Implementation of the agnostic workflow engine for state management.
- **UepaPay Client**: Added `UepaPayClient` for payment processing.
- **Security**: Implemented `EncryptRequest` and `CheckOrder` with remote UepaPay ConfigurationService.
- **Timeouts**: Added configurable request timeouts using `AbortController`.
- **Types**: Strong typing for all UepaPay payloads and responses.
- **Integration Tests**: Added full test suite for client and workflow engine.
- **CI/CD**: Added GitHub Actions workflow for automated testing and builds.
- **License**: Initialized project with MIT license.
