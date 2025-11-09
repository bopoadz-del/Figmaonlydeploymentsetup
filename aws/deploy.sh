#!/bin/bash

###############################################################################
# AWS Deployment Script for Stock Analysis Application
# This script automates the build and deployment process using AWS SAM
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main deployment function
main() {
    print_info "Starting AWS deployment process..."

    # Check prerequisites
    print_info "Checking prerequisites..."

    if ! command_exists aws; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi

    if ! command_exists sam; then
        print_error "AWS SAM CLI is not installed. Please install it first."
        exit 1
    fi

    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 20 or higher."
        exit 1
    fi

    print_success "All prerequisites are installed"

    # Build Lambda function
    print_info "Building Lambda function..."
    cd lambda

    if [ ! -d "node_modules" ]; then
        print_info "Installing dependencies..."
        npm install
    fi

    print_info "Compiling TypeScript..."
    npm run build

    if [ $? -ne 0 ]; then
        print_error "Build failed"
        exit 1
    fi

    cd ..
    print_success "Lambda function built successfully"

    # Deploy with SAM
    print_info "Deploying to AWS..."

    if [ -f "samconfig.toml" ]; then
        # Use existing configuration
        print_info "Using existing SAM configuration"
        sam deploy
    else
        # First-time deployment with guided mode
        print_warning "No SAM configuration found. Starting guided deployment..."
        sam deploy --guided
    fi

    if [ $? -ne 0 ]; then
        print_error "Deployment failed"
        exit 1
    fi

    print_success "Deployment completed successfully!"

    # Get outputs
    print_info "Retrieving stack outputs..."
    STACK_NAME=$(grep "stack_name" samconfig.toml | cut -d '"' -f 2 2>/dev/null || echo "stock-analysis-app")

    API_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" \
        --output text 2>/dev/null)

    if [ -n "$API_URL" ]; then
        print_success "API Gateway Endpoint: $API_URL"

        print_info "Testing health endpoint..."
        HEALTH_CHECK=$(curl -s "${API_URL}health" || echo "")

        if echo "$HEALTH_CHECK" | grep -q "healthy"; then
            print_success "Health check passed!"
            echo "$HEALTH_CHECK" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_CHECK"
        else
            print_warning "Health check failed or returned unexpected response"
            echo "$HEALTH_CHECK"
        fi

        echo ""
        print_info "Next steps:"
        echo "1. Update your .env file with:"
        echo "   REACT_APP_USE_AWS=true"
        echo "   REACT_APP_AWS_API_URL=$API_URL"
        echo ""
        echo "2. Restart your development server:"
        echo "   npm start"
    else
        print_warning "Could not retrieve API endpoint. Check AWS Console."
    fi
}

# Run main function
main "$@"
