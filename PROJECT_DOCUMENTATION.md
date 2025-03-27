# Brik E-Commerce Project Documentation

This document provides a comprehensive overview of how the Brik E-Commerce project fulfills the requirements specified in the REQUIREMENTS.md file.

## Requirements Fulfillment

### Core Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Nest.js** | The entire backend is built using NestJS framework, following its modular architecture pattern. |
| **TypeScript** | All code is written in TypeScript with proper type definitions for enhanced code quality and developer experience. |
| **PostgreSQL** | PostgreSQL is used as the primary database, with TypeORM for database interactions. |
| **Docker** | The project includes Docker and docker-compose configurations for easy setup and deployment. |
| **File Upload** | Implemented using MinIO (S3-compatible) for storing product images. |
| **Audit Logs** | A dedicated AuditLog module records all data changes (create, update, delete operations) with timestamps and user information. |
| **TypeORM** | Used for database interactions, entity definitions, and migrations. |

### Functional Requirements

#### Product Management

The system provides a complete CRUD interface for managing products:

- **Create**: Add new products with details and images
- **Read**: View product details and list products with pagination
- **Update**: Modify existing product information
- **Delete**: Remove products from the system (soft delete)

#### Search and Pagination

- Products can be searched by name, description, or SKU
- Pagination is implemented for the product listing endpoint
- Sorting options are available for different product attributes

#### Checkout Flow

The checkout process includes:

1. Adding products to a cart
2. Validating product availability
3. Processing the order
4. Recording the transaction

#### Data Schema

The product schema follows the required format:

```typescript
export class Product {
  id: number;
  categoryId: number;
  categoryName: string;
  sku: string;
  name: string;
  description: string;
  weight: number;
  width: number;
  length: number;
  height: number;
  image: string;
  harga: number;
}
```

### Technical Implementation Details

#### API Design

- RESTful API architecture
- JSON request/response format
- Proper HTTP status codes and error handling
- Swagger/OpenAPI documentation

#### Database Design

- Normalized database schema
- Foreign key relationships between entities
- Audit logging for data changes
- Soft delete implementation

#### File Storage

- MinIO integration for S3-compatible object storage
- Secure file upload with validation
- File type and size restrictions
- URL generation for file access

#### Testing

The project includes comprehensive unit tests for all modules, focusing on:

- Service logic
- Controller endpoints
- Data validation
- Error handling

**Note on E2E Testing**: End-to-end testing has been intentionally excluded to focus on unit test coverage. The unit tests provide sufficient validation of the application's functionality by mocking external dependencies and focusing on business logic.

## Docker Deployment

This project is fully containerized and designed to be deployed using Docker. This approach ensures consistency across different environments and simplifies the deployment process.

### Docker Configuration

The project includes two Dockerfile configurations:

1. **Dockerfile.dev**: For development environment
   ```dockerfile
   FROM oven/bun:latest

   WORKDIR /app

   COPY package.json .
   COPY bun.lockb .

   RUN bun install

   COPY . .

   CMD ["bun", "run", "start:dev"]
   ```

2. **Dockerfile**: For production environment (multi-stage build)
   ```dockerfile
   # Build stage
   FROM oven/bun:latest AS build

   WORKDIR /app

   # Copy package.json and lockfile
   COPY package.json bun.lockb ./

   # Install dependencies
   RUN bun install --frozen-lockfile

   # Copy source code
   COPY . .

   # Build the application
   RUN bun run build

   # Production stage
   FROM oven/bun:latest AS production

   WORKDIR /app

   # Copy package.json and lockfile
   COPY package.json bun.lockb ./

   # Install only production dependencies
   RUN bun install --frozen-lockfile --production

   # Copy built application from build stage
   COPY --from=build /app/dist ./dist
   COPY --from=build /app/node_modules ./node_modules

   # Copy necessary files for runtime
   COPY .env.example ./

   # Expose the application port
   EXPOSE 3000

   # Set NODE_ENV to production
   ENV NODE_ENV=production

   # Start the application
   CMD ["bun", "run", "start:prod"]
   ```

### Deployment Instructions

1. **Build the Docker image**:
   ```bash
   # For production
   docker build -t brik-api .

   # For development
   docker build -t brik-api:dev -f Dockerfile.dev .
   ```

2. **Run the container**:
   ```bash
   # For production
   docker run -p 8080:8080 --env-file .env brik-api

   # For development
   docker run -p 8080:8080 --env-file .env brik-api:dev
   ```

3. **Using Docker Compose**:
   ```bash
   # For development
   docker compose up -d
   ```

### Environment Variables

The application requires the following environment variables:

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

### MinIO as Object Storage

This project uses MinIO as the object storage solution for the following reasons:

1. **Security**: Using MinIO avoids exposing cloud provider credentials (AWS S3, Google Cloud Storage) in a public repository, which would be a significant security risk.

2. **Compatibility**: MinIO is API-compatible with Amazon S3, which means the application can be easily migrated to use AWS S3 in production by simply changing the environment variables.

3. **Local Development**: MinIO provides a consistent local development experience without requiring cloud resources or credentials.

4. **Flexibility**: The storage service implementation is designed to be easily replaceable with other storage solutions like AWS S3 or Google Cloud Storage in production environments.

For production deployment, you can replace MinIO with AWS S3 or Google Cloud Storage by simply updating the environment variables with the appropriate credentials.

## Running Tests with Docker

Tests can be run directly within the Docker container:

```bash
# Run all unit tests
docker compose exec backend-klontong bun run test
```

## Best Practices Implemented

### Code Organization

- Modular architecture with clear separation of concerns
- Domain-driven design principles
- Repository pattern for data access
- DTO pattern for data validation and transformation

### Security

- Input validation using class-validator
- Error handling and sanitization
- Environment variable management
- File upload validation

### Performance

- Database indexing for frequently queried fields
- Pagination to handle large datasets
- Efficient query optimization
- Multi-stage Docker builds for smaller production images

### SOLID Principles

- **Single Responsibility**: Each class has one responsibility
- **Open/Closed**: Entities are open for extension but closed for modification
- **Liskov Substitution**: Subtypes can be substituted for their base types
- **Interface Segregation**: Clients only depend on interfaces they use
- **Dependency Inversion**: High-level modules depend on abstractions

## Conclusion

This project demonstrates a well-structured NestJS application that fulfills all the requirements specified in the REQUIREMENTS.md file. The implementation follows best practices for code organization, security, and performance, making it a solid foundation for a production e-commerce system. The Docker-based deployment strategy ensures consistent behavior across different environments and simplifies the setup process.
