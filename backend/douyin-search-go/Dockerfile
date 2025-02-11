FROM golang:1.21-alpine

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum first to leverage Docker cache
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=1 \
    apk add --no-cache gcc musl-dev sqlite-dev && \
    go build -o main .

# Expose port 3000
EXPOSE 3000

# Run the application
CMD ["./main"]
