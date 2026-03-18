# Contributing to TF Mobility

Thank you for your interest in contributing to TF Mobility! This is a citizen transparency project, and community contributions are welcome.

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## How to Contribute

1. **Open an issue first** — Before starting work, open a GitHub issue to discuss your proposed change. This helps avoid duplicate effort and ensures alignment with the project direction.
2. **Fork and branch** — Fork the repository and create a feature branch from `main`.
3. **Submit a pull request** — Once your changes are ready, open a PR referencing the related issue.

## Development Setup

### Docker (recommended)

The simplest way to run the full stack locally:

```bash
docker-compose up --build
```

This starts the frontend, backend, ETL pipelines, and Nginx reverse proxy. The ETL service will automatically collect and process data into the SQLite database.

### Individual Services

For working on a specific service, see the [README](README.md#individual-services) for instructions on running each service independently.

## Guidelines

- **Language**: All code, commits, and documentation must be written in **English**.
- **ETL pipelines** run inside Docker and use a single SQLite database file. Do not introduce additional databases.
- **Follow existing conventions** — Match the code style and patterns already present in the codebase.
- **Write tests** for new functionality and ensure existing tests continue to pass.
- **Keep PRs focused** — One feature or fix per pull request.

## Data Notice

The processed data (SQLite database, ETL cache) is not included in the repository. You need to run the ETL pipelines to generate it. See the [README](README.md#getting-started) for details.

## Reporting Issues

Use [GitHub Issues](https://github.com/barckcode/tf-mobility/issues) to report bugs or suggest features. Please include:

- A clear description of the issue
- Steps to reproduce (for bugs)
- Expected vs actual behavior
