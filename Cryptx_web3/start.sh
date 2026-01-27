#!/bin/bash

# CryptX Web3 Portfolio Tracker - Complete Startup Script
# This script starts frontend, backend, and database services

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$PROJECT_ROOT/apps/api"
WEB_DIR="$PROJECT_ROOT/apps/web"
LOG_DIR="$PROJECT_ROOT/logs"

# Create logs directory
mkdir -p "$LOG_DIR"

# Function to print colored output
print_status() {
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

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -ti:$1 >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    if port_in_use $1; then
        print_warning "Port $1 is in use. Killing existing process..."
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo
    print_error "$service_name failed to start within timeout period"
    return 1
}

# Function to check prerequisites
check_prerequisites() {
    print_header "CHECKING PREREQUISITES"
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm found: $NPM_VERSION"
    else
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check PostgreSQL
    if command_exists psql; then
        print_success "PostgreSQL client found"
    else
        print_warning "PostgreSQL client not found. Make sure PostgreSQL is installed and running."
    fi
    
    # Check Redis
    if command_exists redis-cli; then
        print_success "Redis client found"
    else
        print_warning "Redis client not found. Make sure Redis is installed and running."
    fi
    
    # Check for required environment files
    if [ ! -f "$API_DIR/.env" ]; then
        print_error "Backend .env file not found at $API_DIR/.env"
        print_status "Please copy .env.example to .env and configure your environment variables"
        exit 1
    fi
    
    if [ ! -f "$WEB_DIR/.env.local" ]; then
        print_error "Frontend .env.local file not found at $WEB_DIR/.env.local"
        print_status "Please copy .env.example to .env.local and configure your environment variables"
        exit 1
    fi
    
    print_success "All prerequisites checked!"
}

# Function to install dependencies
install_dependencies() {
    print_header "INSTALLING DEPENDENCIES"
    
    print_status "Installing root dependencies..."
    cd "$PROJECT_ROOT"
    npm install
    
    print_status "Installing backend dependencies..."
    cd "$API_DIR"
    npm install
    
    print_status "Installing frontend dependencies..."
    cd "$WEB_DIR"
    npm install
    
    print_success "All dependencies installed!"
}

# Function to setup database
setup_database() {
    print_header "SETTING UP DATABASE"
    
    cd "$API_DIR"
    
    # Check if Prisma is installed
    if ! command_exists npx; then
        print_error "npx not found"
        return 1
    fi
    
    print_status "Generating Prisma client..."
    npx prisma generate
    
    print_status "Running database migrations..."
    npx prisma migrate deploy 2>/dev/null || npx prisma migrate dev --name init
    
    print_success "Database setup completed!"
}

# Function to start services
start_services() {
    print_header "STARTING SERVICES"
    
    # Kill existing processes on required ports
    kill_port 5000  # Backend
    kill_port 3000  # Frontend
    
    # Start backend
    print_status "Starting backend server..."
    cd "$API_DIR"
    npm run dev > "$LOG_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    
    # Start frontend
    print_status "Starting frontend server..."
    cd "$WEB_DIR"
    npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
    
    # Save PIDs for cleanup
    echo "$BACKEND_PID" > "$LOG_DIR/backend.pid"
    echo "$FRONTEND_PID" > "$LOG_DIR/frontend.pid"
    
    print_success "Services started!"
}

# Function to show service status
show_status() {
    print_header "SERVICE STATUS"
    
    # Check backend
    if port_in_use 5000; then
        print_success "Backend is running on port 5000"
        curl -s http://localhost:5000/health >/dev/null && print_success "Backend health check passed" || print_warning "Backend health check failed"
    else
        print_error "Backend is not running"
    fi
    
    # Check frontend
    if port_in_use 3000; then
        print_success "Frontend is running on port 3000"
    else
        print_error "Frontend is not running"
    fi
    
    # Show URLs
    echo
    print_status "Service URLs:"
    echo -e "${CYAN}  Frontend:${NC} http://localhost:3000"
    echo -e "${CYAN}  Backend API:${NC} http://localhost:5000"
    echo -e "${CYAN}  Health Check:${NC} http://localhost:5000/health"
    echo -e "${CYAN}  API Docs:${NC} http://localhost:5000/api-docs (if available)"
}

# Function to stop services
stop_services() {
    print_header "STOPPING SERVICES"
    
    # Stop backend
    if [ -f "$LOG_DIR/backend.pid" ]; then
        BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
        if kill -0 $BACKEND_PID 2>/dev/null; then
            print_status "Stopping backend (PID: $BACKEND_PID)..."
            kill $BACKEND_PID
        fi
        rm -f "$LOG_DIR/backend.pid"
    fi
    
    # Stop frontend
    if [ -f "$LOG_DIR/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$LOG_DIR/frontend.pid")
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            print_status "Stopping frontend (PID: $FRONTEND_PID)..."
            kill $FRONTEND_PID
        fi
        rm -f "$LOG_DIR/frontend.pid"
    fi
    
    # Kill any remaining processes on ports
    kill_port 5000
    kill_port 3000
    
    print_success "All services stopped!"
}

# Function to show logs
show_logs() {
    print_header "SHOWING LOGS"
    
    echo -e "${BLUE}Backend logs:${NC}"
    if [ -f "$LOG_DIR/backend.log" ]; then
        tail -f "$LOG_DIR/backend.log"
    else
        print_warning "No backend log file found"
    fi
}

# Function to cleanup
cleanup() {
    print_status "Performing cleanup..."
    stop_services
    print_success "Cleanup completed!"
}

# Function to show help
show_help() {
    echo "CryptX Web3 Portfolio Tracker - Startup Script"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  start     Start all services (default)"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  status    Show service status"
    echo "  logs      Show service logs"
    echo "  setup     Setup dependencies and database"
    echo "  check     Check prerequisites"
    echo "  cleanup   Stop services and cleanup"
    echo "  help      Show this help message"
    echo
    echo "Examples:"
    echo "  $0                # Start all services"
    echo "  $0 start          # Start all services"
    echo "  $0 stop           # Stop all services"
    echo "  $0 logs           # View logs"
    echo
}

# Main script logic
main() {
    # Set up signal handlers for cleanup
    trap cleanup EXIT INT TERM
    
    # Change to project root
    cd "$PROJECT_ROOT"
    
    # Parse command line arguments
    COMMAND=${1:-start}
    
    case $COMMAND in
        "start")
            check_prerequisites
            install_dependencies
            setup_database
            start_services
            sleep 3
            show_status
            print_status "Press Ctrl+C to stop all services"
            wait
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 2
            start_services
            sleep 3
            show_status
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "setup")
            check_prerequisites
            install_dependencies
            setup_database
            ;;
        "check")
            check_prerequisites
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
