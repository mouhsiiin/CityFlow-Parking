#!/bin/bash

# CityFlow Test Data Generation Script
# This script generates comprehensive test data for the CityFlow system

set -e

API_URL="http://localhost:8080/api/v1"
ADMIN_TOKEN=""
USER_TOKEN=""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         CityFlow Test Data Generation Script                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if API is running
echo -e "${YELLOW}[1/8]${NC} Checking if API is running..."
if curl -s -f "http://localhost:8080/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API is running${NC}"
else
    echo -e "${RED}✗ API is not running. Please start the backend first.${NC}"
    echo -e "${YELLOW}Run: cd backend && ./start.sh${NC}"
    exit 1
fi
echo ""

# Create Admin User
echo -e "${YELLOW}[2/8]${NC} Creating admin user..."
ADMIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cityflow.com",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "User",
    "phone": "+1234567890",
    "role": "admin"
  }' 2>/dev/null || echo '{"error":"User may already exist"}')

if echo "$ADMIN_RESPONSE" | grep -q "token"; then
    ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓ Admin user created: admin@cityflow.com / admin123${NC}"
else
    # Try to login if already exists
    ADMIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "admin@cityflow.com",
        "password": "admin123"
      }')
    ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo -e "${YELLOW}⚠ Admin user already exists, logged in${NC}"
fi
echo ""

# Create Regular Test Users
echo -e "${YELLOW}[3/8]${NC} Creating regular test users..."
USER_EMAILS=("john.doe@example.com" "jane.smith@example.com" "bob.wilson@example.com")
USER_NAMES=("John:Doe" "Jane:Smith" "Bob:Wilson")

for i in "${!USER_EMAILS[@]}"; do
    email="${USER_EMAILS[$i]}"
    IFS=':' read -r firstName lastName <<< "${USER_NAMES[$i]}"
    
    USER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$email\",
        \"password\": \"password123\",
        \"firstName\": \"$firstName\",
        \"lastName\": \"$lastName\",
        \"phone\": \"+1234567$((890 + i))\"
      }" 2>/dev/null || echo '{"error":"User may already exist"}')
    
    if echo "$USER_RESPONSE" | grep -q "token"; then
        echo -e "${GREEN}  ✓ Created user: $email${NC}"
        if [ -z "$USER_TOKEN" ]; then
            USER_TOKEN=$(echo "$USER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        fi
    else
        echo -e "${YELLOW}  ⚠ User already exists: $email${NC}"
    fi
done
echo ""

# If no user token, login with first user
if [ -z "$USER_TOKEN" ]; then
    USER_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "john.doe@example.com",
        "password": "password123"
      }')
    USER_TOKEN=$(echo "$USER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

# Create Parking Spots
echo -e "${YELLOW}[4/8]${NC} Creating parking spots..."
PARKING_SPOTS=(
    "P-001:Downtown Plaza A:Main Street Plaza:40.7128:-74.0060:5.00:regular"
    "P-002:Downtown Plaza B:Main Street Plaza:40.7130:-74.0062:5.00:regular"
    "P-003:City Center P1:City Center Mall:40.7589:-73.9851:7.50:covered"
    "P-004:City Center P2:City Center Mall:40.7591:-73.9853:7.50:covered"
    "P-005:Airport Terminal A1:Airport Parking:40.6413:-73.7781:10.00:regular"
    "P-006:Airport Terminal A2:Airport Parking:40.6415:-73.7783:10.00:regular"
    "P-007:Shopping Mall B1:Westfield Mall:40.7580:-73.9855:6.00:covered"
    "P-008:Shopping Mall B2:Westfield Mall:40.7582:-73.9857:6.00:covered"
    "P-009:Hospital Zone H1:City Hospital:40.7614:-73.9776:8.00:vip"
    "P-010:Hospital Zone H2:City Hospital:40.7616:-73.9778:8.00:vip"
)

PARKING_IDS=()
for spot in "${PARKING_SPOTS[@]}"; do
    IFS=':' read -r spotNumber name location lat lon price spotType <<< "$spot"
    
    SPOT_RESPONSE=$(curl -s -X POST "$API_URL/parking/spots" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -d "{
        \"spotNumber\": \"$spotNumber\",
        \"location\": \"$location\",
        \"latitude\": $lat,
        \"longitude\": $lon,
        \"spotType\": \"$spotType\",
        \"pricePerHour\": $price,
        \"hasEVCharging\": false
      }" 2>/dev/null || echo '{"error":"Failed"}')
    
    if echo "$SPOT_RESPONSE" | grep -q "spotId"; then
        SPOT_ID=$(echo "$SPOT_RESPONSE" | grep -o '"spotId":"[^"]*' | cut -d'"' -f4)
        PARKING_IDS+=("$SPOT_ID")
        echo -e "${GREEN}  ✓ Created parking spot: $name ($spotNumber)${NC}"
    else
        echo -e "${YELLOW}  ⚠ Failed to create: $name${NC}"
    fi
done
echo ""

# Create Charging Stations
echo -e "${YELLOW}[5/8]${NC} Creating charging stations..."
CHARGING_STATIONS=(
    "CS-001:Fast Charger Downtown:Main Street Plaza:40.7129:-74.0061:50:0.35:Type2"
    "CS-002:Supercharger City Center:City Center Mall:40.7590:-73.9852:150:0.40:CCS"
    "CS-003:Airport Fast Charger:Airport Parking:40.6414:-73.7782:75:0.38:CHAdeMO"
    "CS-004:Mall Rapid Charger A:Westfield Mall:40.7581:-73.9856:100:0.37:Type2"
    "CS-005:Mall Rapid Charger B:Westfield Mall:40.7583:-73.9858:100:0.37:CCS"
    "CS-006:Hospital Charger:City Hospital:40.7615:-73.9777:60:0.36:Type2"
)

CHARGING_IDS=()
for station in "${CHARGING_STATIONS[@]}"; do
    IFS=':' read -r stationNumber name location lat lon power price connector <<< "$station"
    
    STATION_RESPONSE=$(curl -s -X POST "$API_URL/charging/stations" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -d "{
        \"stationNumber\": \"$stationNumber\",
        \"location\": \"$location\",
        \"latitude\": $lat,
        \"longitude\": $lon,
        \"powerOutput\": $power,
        \"pricePerKwh\": $price,
        \"connectorType\": \"$connector\"
      }" 2>/dev/null || echo '{"error":"Failed"}')
    
    if echo "$STATION_RESPONSE" | grep -q "stationId"; then
        STATION_ID=$(echo "$STATION_RESPONSE" | grep -o '"stationId":"[^"]*' | cut -d'"' -f4)
        CHARGING_IDS+=("$STATION_ID")
        echo -e "${GREEN}  ✓ Created charging station: $name ($stationNumber)${NC}"
    else
        echo -e "${YELLOW}  ⚠ Failed to create: $name${NC}"
    fi
done
echo ""

# Create Wallets for Users
echo -e "${YELLOW}[6/8]${NC} Creating wallets for users..."

# Create wallet for admin
curl -s -X POST "$API_URL/wallet/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null 2>&1
echo -e "${GREEN}  ✓ Created wallet for admin${NC}"

# Create wallet for test user
curl -s -X POST "$API_URL/wallet/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" > /dev/null 2>&1
echo -e "${GREEN}  ✓ Created wallet for test user${NC}"

# Add funds to wallets
curl -s -X POST "$API_URL/wallet/add-funds" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"amount": 500.00}' > /dev/null 2>&1
echo -e "${GREEN}  ✓ Added $500 to admin wallet${NC}"

curl -s -X POST "$API_URL/wallet/add-funds" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"amount": 100.00}' > /dev/null 2>&1
echo -e "${GREEN}  ✓ Added $100 to test user wallet${NC}"
echo ""

# Create Sample Bookings
echo -e "${YELLOW}[7/8]${NC} Creating sample parking bookings..."
if [ ${#PARKING_IDS[@]} -gt 0 ]; then
    # Create a booking with the first parking spot
    SPOT_ID="${PARKING_IDS[0]}"
    START_TIME=$(date -u -d "+1 hour" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v+1H +"%Y-%m-%dT%H:%M:%SZ")
    END_TIME=$(date -u -d "+3 hours" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v+3H +"%Y-%m-%dT%H:%M:%SZ")
    
    BOOKING_RESPONSE=$(curl -s -X POST "$API_URL/parking/reserve" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $USER_TOKEN" \
      -d "{
        \"spotId\": \"$SPOT_ID\",
        \"startTime\": \"$START_TIME\",
        \"endTime\": \"$END_TIME\"
      }" 2>/dev/null || echo '{"error":"Failed"}')
    
    if echo "$BOOKING_RESPONSE" | grep -q "bookingId"; then
        echo -e "${GREEN}  ✓ Created sample booking${NC}"
    else
        echo -e "${YELLOW}  ⚠ Could not create sample booking${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠ No parking spots available for booking${NC}"
fi
echo ""

# Create Sample Charging Session
echo -e "${YELLOW}[8/8]${NC} Creating sample charging session..."
if [ ${#CHARGING_IDS[@]} -gt 0 ]; then
    STATION_ID="${CHARGING_IDS[0]}"
    
    SESSION_RESPONSE=$(curl -s -X POST "$API_URL/charging/start" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $USER_TOKEN" \
      -d "{
        \"stationId\": \"$STATION_ID\",
        \"vehicleId\": \"TEST-CAR-001\"
      }" 2>/dev/null || echo '{"error":"Failed"}')
    
    if echo "$SESSION_RESPONSE" | grep -q "sessionId"; then
        echo -e "${GREEN}  ✓ Created sample charging session${NC}"
    else
        echo -e "${YELLOW}  ⚠ Could not create sample charging session${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠ No charging stations available for session${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Test Data Created Successfully                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Users Created:${NC}"
echo -e "  Admin:  ${YELLOW}admin@cityflow.com${NC} / ${YELLOW}admin123${NC}"
echo -e "  User 1: ${YELLOW}john.doe@example.com${NC} / ${YELLOW}password123${NC}"
echo -e "  User 2: ${YELLOW}jane.smith@example.com${NC} / ${YELLOW}password123${NC}"
echo -e "  User 3: ${YELLOW}bob.wilson@example.com${NC} / ${YELLOW}password123${NC}"
echo ""
echo -e "${GREEN}Parking Spots Created:${NC} ${YELLOW}${#PARKING_IDS[@]}${NC}"
echo -e "${GREEN}Charging Stations Created:${NC} ${YELLOW}${#CHARGING_IDS[@]}${NC}"
echo ""
echo -e "${GREEN}Wallets Created:${NC}"
echo -e "  Admin wallet: ${YELLOW}\$500.00${NC}"
echo -e "  Test user wallet: ${YELLOW}\$100.00${NC}"
echo ""
echo -e "${BLUE}Access the application:${NC}"
echo -e "  Frontend: ${YELLOW}http://localhost:5173${NC}"
echo -e "  Backend API: ${YELLOW}http://localhost:8080${NC}"
echo -e "  Security Dashboard: ${YELLOW}http://localhost:5173/admin/security${NC} (admin only)"
echo ""
echo -e "${GREEN}✓ Test data generation complete!${NC}"
