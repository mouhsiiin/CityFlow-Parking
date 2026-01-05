#!/bin/bash

# CityFlow Security Monitor - Terminal Dashboard
# Real-time security monitoring in your terminal

API_BASE="http://localhost:8080/api/v1"
TOKEN=""
REFRESH_INTERVAL=5

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Function to clear screen
clear_screen() {
    clear
    echo -e "${CYAN}${BOLD}"
    echo "╔════════════════════════════════════════════════════════════════════════╗"
    echo "║           CityFlow Security Monitor - Live Dashboard                  ║"
    echo "╚════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Function to display header
show_header() {
    echo -e "${WHITE}${BOLD}Last Update: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${BLUE}Auto-refresh: Every ${REFRESH_INTERVAL} seconds (Press Ctrl+C to exit)${NC}"
    echo ""
}

# Function to get token if not set
get_token() {
    if [ -z "$TOKEN" ]; then
        echo -e "${YELLOW}Please enter your admin JWT token:${NC}"
        read -r TOKEN
        
        if [ -z "$TOKEN" ]; then
            echo -e "${RED}Token is required. Exiting...${NC}"
            exit 1
        fi
    fi
}

# Function to display system health
show_health() {
    local health_data=$(curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE}/security/health")
    
    if echo "$health_data" | grep -q "success"; then
        local status=$(echo "$health_data" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
        local score=$(echo "$health_data" | grep -o '"score":[0-9]*' | grep -o '[0-9]*' | head -1)
        
        echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${WHITE}${BOLD}  System Health Status${NC}"
        echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        case "$status" in
            "healthy")
                echo -e "  Status: ${GREEN}${BOLD}● HEALTHY${NC}"
                ;;
            "warning")
                echo -e "  Status: ${YELLOW}${BOLD}▲ WARNING${NC}"
                ;;
            "critical")
                echo -e "  Status: ${RED}${BOLD}✖ CRITICAL${NC}"
                ;;
        esac
        
        echo -e "  Score:  ${WHITE}${BOLD}${score}/100${NC}"
        echo ""
    else
        echo -e "${RED}Failed to fetch health data${NC}"
    fi
}

# Function to display statistics
show_stats() {
    local dashboard=$(curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE}/security/dashboard")
    
    if echo "$dashboard" | grep -q "success"; then
        local total=$(echo "$dashboard" | grep -o '"totalEvents":[0-9]*' | grep -o '[0-9]*')
        local failed=$(echo "$dashboard" | grep -o '"failedLogins":[0-9]*' | grep -o '[0-9]*')
        local unauth=$(echo "$dashboard" | grep -o '"unauthorizedAccess":[0-9]*' | grep -o '[0-9]*')
        local active_alerts=$(echo "$dashboard" | grep -o '"activeAlerts":[0-9]*' | grep -o '[0-9]*')
        
        echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${WHITE}${BOLD}  Security Statistics (Last 24 Hours)${NC}"
        echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        printf "  %-30s ${CYAN}${BOLD}%10s${NC}\n" "Total Events:" "$total"
        printf "  %-30s ${RED}${BOLD}%10s${NC}\n" "Failed Login Attempts:" "$failed"
        printf "  %-30s ${YELLOW}${BOLD}%10s${NC}\n" "Unauthorized Access:" "$unauth"
        printf "  %-30s ${MAGENTA}${BOLD}%10s${NC}\n" "Active Alerts:" "$active_alerts"
        echo ""
    fi
}

# Function to display active alerts
show_alerts() {
    local alerts=$(curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE}/security/alerts?active=true")
    
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}${BOLD}  Active Security Alerts${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if echo "$alerts" | grep -q '"total":0'; then
        echo -e "  ${GREEN}✓ No active alerts${NC}"
    else
        # Parse and display alerts (simplified)
        local alert_count=$(echo "$alerts" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
        
        if [ -n "$alert_count" ] && [ "$alert_count" -gt 0 ]; then
            echo -e "  ${RED}${BOLD}⚠ $alert_count alert(s) detected!${NC}"
            
            # Try to extract alert types
            if echo "$alerts" | grep -q "BRUTE_FORCE"; then
                echo -e "    ${RED}• Brute force attack detected${NC}"
            fi
            if echo "$alerts" | grep -q "UNAUTHORIZED"; then
                echo -e "    ${YELLOW}• Unauthorized access pattern${NC}"
            fi
            if echo "$alerts" | grep -q "RATE_LIMIT"; then
                echo -e "    ${YELLOW}• Rate limit abuse detected${NC}"
            fi
        else
            echo -e "  ${GREEN}✓ No active alerts${NC}"
        fi
    fi
    echo ""
}

# Function to display recent events
show_recent_events() {
    local events=$(curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE}/security/events?limit=10")
    
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}${BOLD}  Recent Security Events (Last 10)${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if echo "$events" | grep -q "success"; then
        # Count events by type (simplified)
        local login_success=$(echo "$events" | grep -o "LOGIN_SUCCESS" | wc -l)
        local login_failure=$(echo "$events" | grep -o "LOGIN_FAILURE" | wc -l)
        local unauth=$(echo "$events" | grep -o "UNAUTHORIZED_ACCESS" | wc -l)
        local admin=$(echo "$events" | grep -o "ADMIN_ACTION" | wc -l)
        
        [ "$login_success" -gt 0 ] && echo -e "  ${GREEN}✓${NC} Login Success:        $login_success"
        [ "$login_failure" -gt 0 ] && echo -e "  ${RED}✗${NC} Login Failure:        $login_failure"
        [ "$unauth" -gt 0 ] && echo -e "  ${YELLOW}⚠${NC} Unauthorized Access:  $unauth"
        [ "$admin" -gt 0 ] && echo -e "  ${BLUE}●${NC} Admin Action:         $admin"
        
        if [ "$login_success" -eq 0 ] && [ "$login_failure" -eq 0 ] && [ "$unauth" -eq 0 ] && [ "$admin" -eq 0 ]; then
            echo -e "  ${CYAN}No recent events${NC}"
        fi
    else
        echo -e "  ${RED}Failed to fetch events${NC}"
    fi
    echo ""
}

# Function to display top IPs
show_top_ips() {
    local dashboard=$(curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE}/security/dashboard")
    
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}${BOLD}  Top IP Addresses${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if echo "$dashboard" | grep -q "topIpAddresses"; then
        # This is simplified - in reality you'd parse JSON properly
        echo -e "  ${CYAN}(View full details in API or web dashboard)${NC}"
    else
        echo -e "  ${CYAN}No IP data available${NC}"
    fi
    echo ""
}

# Main monitoring loop
main() {
    echo -e "${CYAN}${BOLD}"
    echo "╔════════════════════════════════════════════════════════════════════════╗"
    echo "║           CityFlow Security Monitor - Terminal Edition                ║"
    echo "╚════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    
    get_token
    
    # Test token
    test_response=$(curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE}/security/health")
    if ! echo "$test_response" | grep -q "success"; then
        echo -e "${RED}Invalid token or authentication failed${NC}"
        echo "Response: $test_response"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Authentication successful${NC}"
    sleep 2
    
    # Main loop
    while true; do
        clear_screen
        show_header
        show_health
        show_stats
        show_alerts
        show_recent_events
        show_top_ips
        
        echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}Press Ctrl+C to exit${NC}"
        
        sleep $REFRESH_INTERVAL
    done
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${YELLOW}Monitoring stopped. Goodbye!${NC}"; exit 0' INT

# Run main function
main
