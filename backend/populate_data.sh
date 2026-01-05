#!/bin/bash

# Populate charging stations and parking spots (Morocco — focus: Tangier)
# Requires: backend running, `jq` installed

set -euo pipefail

API_BASE="http://localhost:8080/api/v1"
API_BARE_BASE="http://localhost:8080"
ADMIN_EMAIL="admin@admin.com"
ADMIN_PASSWORD="admin123"

echo "Checking backend health..."
if ! curl -s -f "${API_BARE_BASE%/}/health" > /dev/null; then
  echo "Backend not reachable at ${API_BARE_BASE%/}/health"
  exit 1
fi

echo "Attempting to register admin (ignored if already exists)..."
curl -s -X POST "${API_BASE}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${ADMIN_EMAIL}\",
    \"password\": \"${ADMIN_PASSWORD}\",
    \"firstName\": \"Admin\",
    \"lastName\": \"User\",
    \"phone\": \"+0000000000\",
    \"role\": \"admin\"
  }" > /dev/null || true

echo "Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${ADMIN_EMAIL}\", \"password\": \"${ADMIN_PASSWORD}\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ]; then
  echo "Failed to retrieve token. Response:"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "Token retrieved."

# Stations: use fields expected by CreateStationRequest in charging_handler.go
declare -a STATIONS=(
  '{"stationNumber":"TG-1","location":"Tangier, Morocco","latitude":35.7595,"longitude":-5.8340,"powerOutput":50,"pricePerKwh":0.20,"connectorType":"Type2"}'
  '{"stationNumber":"TG-2","location":"Tangier, Morocco","latitude":35.7900,"longitude":-5.8200,"powerOutput":100,"pricePerKwh":0.18,"connectorType":"CCS"}'
  '{"stationNumber":"TG-3","location":"Tetouan, Morocco","latitude":35.5756,"longitude":-5.3686,"powerOutput":60,"pricePerKwh":0.19,"connectorType":"Type2"}'
  '{"stationNumber":"TG-4","location":"Chefchaouen, Morocco","latitude":35.1686,"longitude":-5.2697,"powerOutput":40,"pricePerKwh":0.21,"connectorType":"Type2"}'
  '{"stationNumber":"CAS-1","location":"Casablanca, Morocco","latitude":33.5731,"longitude":-7.5898,"powerOutput":120,"pricePerKwh":0.22,"connectorType":"Type2"}'
  '{"stationNumber":"RBT-1","location":"Rabat, Morocco","latitude":34.020882,"longitude":-6.842937,"powerOutput":80,"pricePerKwh":0.20,"connectorType":"Type2"}'
  '{"stationNumber":"MKR-1","location":"Marrakech, Morocco","latitude":31.6295,"longitude":-7.9811,"powerOutput":100,"pricePerKwh":0.23,"connectorType":"CCS"}'
  '{"stationNumber":"FEZ-1","location":"Fez, Morocco","latitude":34.0181,"longitude":-5.0078,"powerOutput":60,"pricePerKwh":0.19,"connectorType":"Type2"}'
  '{"stationNumber":"AGA-1","location":"Agadir, Morocco","latitude":30.4278,"longitude":-9.5981,"powerOutput":90,"pricePerKwh":0.21,"connectorType":"Type2"}'
  '{"stationNumber":"NDR-1","location":"Nador, Morocco","latitude":35.1684,"longitude":-2.9336,"powerOutput":50,"pricePerKwh":0.20,"connectorType":"Type2"}'
  '{"stationNumber":"MKN-1","location":"Meknes, Morocco","latitude":33.8958,"longitude":-5.5474,"powerOutput":50,"pricePerKwh":0.18,"connectorType":"Type2"}'
  '{"stationNumber":"OJD-1","location":"Oujda, Morocco","latitude":34.6824,"longitude":-1.9086,"powerOutput":70,"pricePerKwh":0.22,"connectorType":"Type2"}'
)

# Spots: use fields expected by CreateSpotRequest in parking_handler.go
declare -a SPOTS=(
  '{"spotNumber":"TG-S1","location":"Tangier, Morocco","latitude":35.7595,"longitude":-5.8340,"spotType":"standard","pricePerHour":0.50,"hasEVCharging":true}'
  '{"spotNumber":"TG-S2","location":"Tangier, Morocco","latitude":35.7605,"longitude":-5.8330,"spotType":"compact","pricePerHour":0.40,"hasEVCharging":false}'
  '{"spotNumber":"TG-S3","location":"Tetouan, Morocco","latitude":35.5756,"longitude":-5.3686,"spotType":"standard","pricePerHour":0.45,"hasEVCharging":true}'
  '{"spotNumber":"TG-S4","location":"Chefchaouen, Morocco","latitude":35.1686,"longitude":-5.2697,"spotType":"compact","pricePerHour":0.35,"hasEVCharging":false}'
  '{"spotNumber":"CAS-S1","location":"Casablanca, Morocco","latitude":33.5731,"longitude":-7.5898,"spotType":"large","pricePerHour":0.60,"hasEVCharging":true}'
  '{"spotNumber":"RBT-S1","location":"Rabat, Morocco","latitude":34.0209,"longitude":-6.8417,"spotType":"standard","pricePerHour":0.45,"hasEVCharging":false}'
  '{"spotNumber":"MKR-S1","location":"Marrakech, Morocco","latitude":31.6295,"longitude":-7.9811,"spotType":"standard","pricePerHour":0.55,"hasEVCharging":true}'
  '{"spotNumber":"FEZ-S1","location":"Fez, Morocco","latitude":34.0181,"longitude":-5.0078,"spotType":"compact","pricePerHour":0.40,"hasEVCharging":false}'
  '{"spotNumber":"AGA-S1","location":"Agadir, Morocco","latitude":30.4278,"longitude":-9.5981,"spotType":"large","pricePerHour":0.50,"hasEVCharging":true}'
  '{"spotNumber":"NDR-S1","location":"Nador, Morocco","latitude":35.1684,"longitude":-2.9336,"spotType":"standard","pricePerHour":0.45,"hasEVCharging":false}'
  '{"spotNumber":"MKN-S1","location":"Meknes, Morocco","latitude":33.8958,"longitude":-5.5474,"spotType":"standard","pricePerHour":0.42,"hasEVCharging":false}'
  '{"spotNumber":"OJD-S1","location":"Oujda, Morocco","latitude":34.6824,"longitude":-1.9086,"spotType":"standard","pricePerHour":0.48,"hasEVCharging":false}'
)

create_station() {
  local payload="$1"
  local name
  name=$(echo "$payload" | jq -r '.stationNumber')
  echo "Creating station: $name"
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_BASE}/charging/stations" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload")
  if [ "$code" -eq 201 ] || [ "$code" -eq 200 ]; then
    echo "  ✓ $name created (HTTP $code)"
  else
    echo "  ✗ Failed to create $name (HTTP $code)"
  fi
}

create_spot() {
  local payload="$1"
  local name
  name=$(echo "$payload" | jq -r '.spotNumber')
  echo "Creating spot: $name"
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_BASE}/parking/spots" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload")
  if [ "$code" -eq 201 ] || [ "$code" -eq 200 ]; then
    echo "  ✓ $name created (HTTP $code)"
  else
    echo "  ✗ Failed to create $name (HTTP $code)"
  fi
}

echo "Creating stations..."
for s in "${STATIONS[@]}"; do
  create_station "$s"
done

echo "Creating spots..."
for p in "${SPOTS[@]}"; do
  create_spot "$p"
done

echo "Data population complete."
 