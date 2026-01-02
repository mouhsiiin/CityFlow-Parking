package main

import (
	"log"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/mouhsiiin/CityFlow-Parking/backend/chaincode/user/contract"
)

func main() {
	userChaincode, err := contractapi.NewChaincode(&contract.UserContract{})
	if err != nil {
		log.Panicf("Error creating user chaincode: %v", err)
	}

	if err := userChaincode.Start(); err != nil {
		log.Panicf("Error starting user chaincode: %v", err)
	}
}
