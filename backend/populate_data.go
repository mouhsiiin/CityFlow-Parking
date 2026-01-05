package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type AuthResponse struct {
	Token string `json:"token"`
}

type Station struct {
	Name     string  `json:"name"`
	Location string  `json:"location"`
	Capacity int     `json:"capacity"`
}

type Spot struct {
	Name     string  `json:"name"`
	Location string  `json:"location"`
	Capacity int     `json:"capacity"`
}

func authenticate(apiURL, username, password string) (string, error) {
	credentials := map[string]string{
		"username": username,
		"password": password,
	}
	body, _ := json.Marshal(credentials)
	resp, err := http.Post(apiURL+"/auth/login", "application/json", bytes.NewBuffer(body))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to authenticate: %s", resp.Status)
	}

	var authResp AuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		return "", err
	}

	return authResp.Token, nil
}

func createStation(apiURL, token string, station Station) error {
	body, _ := json.Marshal(station)
	req, err := http.NewRequest("POST", apiURL+"/api/v1/charging/stations", bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("failed to create station: %s", resp.Status)
	}

	return nil
}

func createSpot(apiURL, token string, spot Spot) error {
	body, _ := json.Marshal(spot)
	req, err := http.NewRequest("POST", apiURL+"/api/v1/parking/spots", bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("failed to create spot: %s", resp.Status)
	}

	return nil
}

func main() {
	apiURL := "http://localhost:8080"
	username := "admin"
	password := "password"

	token, err := authenticate(apiURL, username, password)
	if err != nil {
		fmt.Println("Error authenticating:", err)
		return
	}

	stations := []Station{
		{Name: "Tangier Station 1", Location: "Tangier, Morocco", Capacity: 10},
		{Name: "Tangier Station 2", Location: "Tangier, Morocco", Capacity: 15},
		{Name: "Casablanca Station", Location: "Casablanca, Morocco", Capacity: 20},
	}

	spots := []Spot{
		{Name: "Tangier Spot 1", Location: "Tangier, Morocco", Capacity: 5},
		{Name: "Tangier Spot 2", Location: "Tangier, Morocco", Capacity: 8},
		{Name: "Rabat Spot", Location: "Rabat, Morocco", Capacity: 10},
	}

	for _, station := range stations {
		if err := createStation(apiURL, token, station); err != nil {
			fmt.Println("Error creating station:", err)
		} else {
			fmt.Println("Created station:", station.Name)
		}
	}

	for _, spot := range spots {
		if err := createSpot(apiURL, token, spot); err != nil {
			fmt.Println("Error creating spot:", err)
		} else {
			fmt.Println("Created spot:", spot.Name)
		}
	}
}