import { apiClient } from './api';
import type { ParkingSpot, ChargingStation } from '../types';

export interface CreateParkingSpotRequest {
  spotNumber: string;
  location: string;
  latitude: number;
  longitude: number;
  spotType: string;
  pricePerHour: number;
  hasEVCharging: boolean;
  operatorId?: string;
}

export interface UpdateParkingSpotRequest {
  spotNumber?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  spotType?: string;
  pricePerHour?: number;
  hasEVCharging?: boolean;
}

export interface CreateChargingStationRequest {
  stationNumber: string;
  location: string;
  latitude: number;
  longitude: number;
  powerOutput: number;
  pricePerKwh: number;
  connectorType: string;
  operatorId?: string;
}

export interface UpdateChargingStationRequest {
  stationNumber?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  powerOutput?: number;
  pricePerKwh?: number;
  connectorType?: string;
}

class AdminService {
  // ==================== Parking Spot Management ====================
  
  async createParkingSpot(data: CreateParkingSpotRequest) {
    return apiClient.post('/api/v1/parking/spots', data);
  }

  async updateParkingSpot(spotId: string, data: UpdateParkingSpotRequest) {
    return apiClient.put(`/api/v1/parking/spots/${spotId}`, data);
  }

  async deleteParkingSpot(spotId: string) {
    return apiClient.delete(`/api/v1/parking/spots/${spotId}`);
  }

  async getAllParkingSpots(): Promise<{ spots: ParkingSpot[] }> {
    return apiClient.get('/api/v1/parking/spots');
  }

  async getParkingSpot(spotId: string): Promise<{ spot: ParkingSpot }> {
    return apiClient.get(`/api/v1/parking/spots/${spotId}`);
  }

  // ==================== Charging Station Management ====================
  
  async createChargingStation(data: CreateChargingStationRequest) {
    return apiClient.post('/api/v1/charging/stations', data);
  }

  async updateChargingStation(stationId: string, data: UpdateChargingStationRequest) {
    return apiClient.put(`/api/v1/charging/stations/${stationId}`, data);
  }

  async deleteChargingStation(stationId: string) {
    return apiClient.delete(`/api/v1/charging/stations/${stationId}`);
  }

  async getAllChargingStations(): Promise<{ stations: ChargingStation[] }> {
    return apiClient.get('/api/v1/charging/stations');
  }

  async getChargingStation(stationId: string): Promise<{ station: ChargingStation }> {
    return apiClient.get(`/api/v1/charging/stations/${stationId}`);
  }

  // ==================== Statistics ====================
  
async getDashboardStats() {
  const [parkingSpots, chargingStations] = await Promise.all([
    this.getAllParkingSpots(),
    this.getAllChargingStations(),
  ]);

  // Use ?? [] to ensure you're always calling .filter on an array
  const spots = parkingSpots?.spots ?? [];
  const stations = chargingStations?.stations ?? [];

  const availableParkingSpots = spots.filter(
    (spot) => spot.status === 'available'
  ).length;

  const availableChargingStations = stations.filter(
    (station) => station.status === 'available'
  ).length;

  return {
    totalParkingSpots: spots.length,
    availableParkingSpots,
    occupiedParkingSpots: spots.filter((s) => s.status === 'occupied').length,
    totalChargingStations: stations.length,
    availableChargingStations,
    inUseChargingStations: stations.filter(
      (s) => s.status === 'in-use'
    ).length,
  };
}


}
export const adminService = new AdminService();
