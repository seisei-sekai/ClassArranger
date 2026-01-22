#!/bin/bash

# ClassArranger Git-Based Deployment Script
# This script uses Git to deploy code changes to the VM (Best Practice)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${PROJECT_ID:-"project-2a5e0dcf-0fe6-42d1-9be"}
ZONE=${ZONE:-"asia-northeast1-a"}
INSTANCE_NAME=${INSTANCE_NAME:-"classarranger-vm"}
GIT_BRANCH=${GIT_BRANCH:-"main"}

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}   ClassArranger Git Deployment${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Function to print step
print_step() {
    echo -e "${YELLOW}>>> $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Step 1: Check if VM is running
print_step "Checking VM status..."
if ! gcloud compute instances describe "$INSTANCE_NAME" \
    --zone="$ZONE" \
    --project="$PROJECT_ID" \
    --format="value(status)" | grep -q "RUNNING"; then
    print_error "VM is not running. Please start it first."
    exit 1
fi
print_success "VM is running"

# Step 2: Push local changes to Git (if any)
print_step "Checking for uncommitted changes..."
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}You have uncommitted changes. Please commit and push them first:${NC}"
    echo ""
    echo "  git add ."
    echo "  git commit -m 'Your commit message'"
    echo "  git push origin $GIT_BRANCH"
    echo ""
    read -p "Have you pushed your changes? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
else
    print_success "No uncommitted changes"
fi

# Step 3: Pull latest changes on VM
print_step "Pulling latest code on VM..."
gcloud compute ssh "$INSTANCE_NAME" \
    --zone="$ZONE" \
    --project="$PROJECT_ID" \
    --command="cd /opt/classarranger && git fetch origin && git checkout $GIT_BRANCH && git pull origin $GIT_BRANCH"

if [ $? -eq 0 ]; then
    print_success "Code updated successfully"
else
    print_error "Failed to pull latest code"
    exit 1
fi

# Step 4: Rebuild and restart services
print_step "Rebuilding and restarting services..."
gcloud compute ssh "$INSTANCE_NAME" \
    --zone="$ZONE" \
    --project="$PROJECT_ID" \
    --command="cd /opt/classarranger && sudo docker-compose -f docker-compose.prod.yml up -d --build"

if [ $? -eq 0 ]; then
    print_success "Services restarted successfully"
else
    print_error "Failed to restart services"
    exit 1
fi

# Step 5: Wait for services to be ready
print_step "Waiting for services to be ready (30 seconds)..."
sleep 30

# Step 6: Health check
print_step "Running health checks..."

# Get VM external IP
EXTERNAL_IP=$(gcloud compute instances describe "$INSTANCE_NAME" \
    --zone="$ZONE" \
    --project="$PROJECT_ID" \
    --format="value(networkInterfaces[0].accessConfigs[0].natIP)")

# Test backend
echo -n "Testing backend API... "
if curl -s -f "http://$EXTERNAL_IP:8000/health" > /dev/null 2>&1; then
    print_success "Backend is healthy"
else
    print_error "Backend health check failed"
fi

# Test frontend
echo -n "Testing frontend... "
if curl -s -f "http://$EXTERNAL_IP" > /dev/null 2>&1; then
    print_success "Frontend is accessible"
else
    print_error "Frontend check failed"
fi

# Step 7: Show service status
print_step "Checking service status..."
gcloud compute ssh "$INSTANCE_NAME" \
    --zone="$ZONE" \
    --project="$PROJECT_ID" \
    --command="sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

# Step 8: Summary
echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}   Deployment Complete! 🎉${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${BLUE}📱 Frontend:${NC}  http://$EXTERNAL_IP"
echo -e "${BLUE}🔌 Backend:${NC}   http://$EXTERNAL_IP:8000"
echo -e "${BLUE}📚 API Docs:${NC}  http://$EXTERNAL_IP:8000/docs"
echo ""
echo -e "${YELLOW}💡 Useful commands:${NC}"
echo "  # View logs"
echo "  gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID --command='sudo docker logs -f classarranger-backend-1'"
echo ""
echo "  # Check status"
echo "  gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID --command='sudo docker ps'"
echo ""
echo "  # Rollback to previous commit"
echo "  ./scripts/rollback-git.sh <commit-hash>"
echo ""

