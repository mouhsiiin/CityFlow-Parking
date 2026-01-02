package main

import (
	"log"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/mouhsiiin/CityFlow-Parking/backend/chaincode/parking/contract"
)

func main() {
	parkingChaincode, err := contractapi.NewChaincode(&contract.ParkingContract{})
	if err != nil {
		log.Panicf("Error creating parking chaincode: %v", err)
	}

	if err := parkingChaincode.Start(); err != nil {
		log.Panicf("Error starting parking chaincode: %v", err)
	}
}
