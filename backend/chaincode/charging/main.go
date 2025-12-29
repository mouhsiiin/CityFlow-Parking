package main

import (
	"log"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/SecurDrgorP/cityflow-parking-backend/chaincode/charging/contract"
)

func main() {
	chargingChaincode, err := contractapi.NewChaincode(&contract.ChargingContract{})
	if err != nil {
		log.Panicf("Error creating charging chaincode: %v", err)
	}

	if err := chargingChaincode.Start(); err != nil {
		log.Panicf("Error starting charging chaincode: %v", err)
	}
}
