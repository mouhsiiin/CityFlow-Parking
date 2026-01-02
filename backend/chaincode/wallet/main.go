package main

import (
	"log"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/mouhsiiin/CityFlow-Parking/backend/chaincode/wallet/contract"
)

func main() {
	walletChaincode, err := contractapi.NewChaincode(&contract.WalletContract{})
	if err != nil {
		log.Panicf("Error creating wallet chaincode: %v", err)
	}

	if err := walletChaincode.Start(); err != nil {
		log.Panicf("Error starting wallet chaincode: %v", err)
	}
}
