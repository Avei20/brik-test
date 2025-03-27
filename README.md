# Brik E-Commerce API

A NestJS-based e-commerce API for managing products, categories, checkout processes, and audit logging.

## Project Overview

This project is a RESTful API built with NestJS that provides endpoints for managing products and handling checkout processes. The application follows a modular architecture with separate modules for products, checkout, and storage functionalities.

### Tech Stack

- **Backend Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **File Storage**: MinIO (S3-compatible object storage)
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest for unit testing
- **Containerization**: Docker

### Key Features

1. **Product Management**:
   - CRUD operations for products
   - Pagination and search functionality
   - File upload for product images

2. **Category Management**:
   - Products organized by categories

3. **Checkout Process**:
   - Add products to cart
   - Process orders

4. **Audit Logging**:
   - Track all data changes
   - Record user actions

## Project Structure

```
brik-test/
├── src/
│   ├── app.module.ts         # Main application module
│   ├── main.ts               # Application entry point
│   ├── product/              # Product module
│   │   ├── product.controller.ts
│   │   ├── product.service.ts
│   │   ├── product.entity.ts
│   │   └── dto/              # Data Transfer Objects
│   ├── checkout/             # Checkout module
│   │   ├── checkout.controller.ts
│   │   ├── checkout.service.ts
│   │   └── dto/
│   ├── auditLog/             # Audit logging module
│   │   ├── auditLog.service.ts
│   │   └── auditLog.entity.ts
│   ├── storage/              # Storage module for file uploads
│   │   └── minio.service.ts
│   └── common/               # Shared resources
│       ├── dto/
│       ├── filters/
│       └── interceptors/
├── test/                     # Test files
├── .env                      # Environment variables
├── .env.test                 # Test environment variables
├── docker-compose.yml        # Docker configuration
├── Dockerfile                # Production Docker configuration
├── Dockerfile.dev            # Development Docker configuration
└── package.json              # Project dependencies
```

## Getting Started with Docker

This project is fully containerized and designed to be run using Docker. This approach ensures consistency across different environments and simplifies the setup process.

### Prerequisites

- Docker and Docker Compose

### Running with Docker Compose

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/brik-test.git
   cd brik-test
   ```

2. Create environment files:
   - Copy `.env.example` to `.env` and update the values if needed

3. Start the application and required services:
   ```bash
   # For development
   docker-compose -f docker-compose.yml up -d
   
   # For production
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. The application will be available at:
   - API: `http://localhost:3000`
   - Swagger documentation: `http://localhost:3000/api`
   - MinIO console: `http://localhost:9001` (if using the included MinIO service)

### Building and Running the Docker Image Directly

You can also build and run the Docker image directly:

```bash
# Build the production image
docker build -t brik-api .

# Build the development image
docker build -t brik-api:dev -f Dockerfile.dev .

# Run the production image
docker run -p 3000:3000 --env-file .env brik-api

# Run the development image
docker run -p 3000:3000 --env-file .env brik-api:dev
```

## Environment Variables

The application uses the following environment variables:

```
# Database Configuration
DB_HOST=postgres        # Database hostname (use service name in docker-compose)
DB_PORT=5432            # Database port
DB_USERNAME=postgres    # Database username
DB_PASSWORD=postgres    # Database password
DB_DATABASE=brik        # Database name

# MinIO Configuration
MINIO_ENDPOINT=minio    # MinIO hostname (use service name in docker-compose)
MINIO_PORT=9000         # MinIO API port
MINIO_USE_SSL=false     # Whether to use SSL for MinIO connection
MINIO_ACCESS_KEY=minioadmin    # MinIO access key
MINIO_SECRET_KEY=minioadmin    # MinIO secret key
MINIO_BUCKET=brik-bucket      # MinIO bucket name
```

### Note on MinIO Usage

This project uses MinIO as the object storage solution for the following reasons:

1. **Security**: Avoids exposing cloud provider credentials (AWS S3, Google Cloud Storage) in a public repository
2. **Compatibility**: MinIO is API-compatible with Amazon S3, making it easy to switch to S3 in production
3. **Local Development**: Provides a consistent local development experience without requiring cloud resources
4. **Flexibility**: Can be easily replaced with other storage solutions like AWS S3 or Google Cloud Storage in production

For production deployment, you can replace MinIO with AWS S3 or Google Cloud Storage by simply updating the environment variables with the appropriate credentials.

## Testing

The project includes comprehensive unit tests for all modules. End-to-end (e2e) testing has been intentionally excluded to focus on unit test coverage.

### Running Tests with Docker

```bash
# Run all unit tests
docker-compose exec api bun run test

# Run tests with coverage
docker-compose exec api bun run test:cov
```

### Test Coverage

The unit tests cover:
- Product service and controller
- Checkout service
- Audit log service
- MinIO service for file storage

### Note on E2E Testing

This project intentionally does not implement end-to-end (e2e) testing to focus on comprehensive unit test coverage. The unit tests provide sufficient validation of the application's functionality by mocking external dependencies and focusing on business logic.

## API Documentation

The API is documented using Swagger. Once the application is running, you can access the Swagger UI at:

```
http://localhost:3000/api
```

The documentation includes:
- All available endpoints
- Request/response schemas
- Authentication requirements
- Example requests

## Requirements Fulfillment

### Product Management

- Create, read, update, and delete products
- Product search and filtering
- Product categorization
- Image upload and management

### Checkout Process

- Add products to cart
- Process checkout
- Handle product availability

### Audit Logging

- Track all data changes
- Record user actions with timestamps

### API Design

- RESTful API design
- Proper error handling
- Input validation
- Swagger documentation

### Testing

- Comprehensive unit tests
- Mocking of external dependencies
- E2E tests (intentionally excluded)

