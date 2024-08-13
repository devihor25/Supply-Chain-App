import React, { useState, useEffect } from "react";
import { ethers, Signer, providers } from "ethers";
import { abi } from "./Tracking.json";
import Web3Modal from 'web3modal';
import { error } from "console";
const contractAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

type signerOrProvider = Signer | providers.Provider;

enum ShipmentStatus {
    Pending,
    In_Transit,
    Completed
}

interface Shipment {
    sender: string;
    receiver: string;
    pickupTime:Number;
    deliveryTime:Number;
    distance: Number;
    price: Number;
    status: ShipmentStatus;
    isPaid: boolean;
}

interface completeShipmentData{
  sender:string,
  receiver:string,
  index:Number
}
const fetchContract = (signerOrProvider: signerOrProvider) => {
    return new ethers.Contract(contractAddress, abi, signerOrProvider);
};

export const TrackingContext=React.createContext("");
export const TrackingProvider=({children}:any)=>{

  const createShipment = async (items:Shipment) => {
    console.log(items);
    const {receiver,pickupTime,sender,price,distance}=items;
    try{
      const web3Modal=new Web3Modal();
      const connection=await web3Modal.connect();
      const provider= new ethers.providers.Web3Provider(connection);
      const signer=provider.getSigner();
      const contract=fetchContract(signer);
      const createItem = await contract.createShipment(
        receiver,
        new Date(String(pickupTime)).getTime(),
        ethers.utils.parseUnits(String(price),18),
        {
          value:ethers.utils.parseUnits(String(price),18)
        }
      )
      await createItem.wait(); // this line waits for the transaction to be confirmed
      console.log(createItem);
    }catch(err){
      console.log(err);
    }
 };

 const getAllShipment=async ()=>{
     //When we just need data from the blockchain we dont need a connection or signer instead we just need a provider
     // A provider is used only for a read only operation whereas signer for a pass operations
     try{
      const provider=new ethers.providers.JsonRpcProvider();
      const contract=fetchContract(provider);
      const shipments=await contract.getAllTransactions();
      const allShipments=shipments.map((shipment:Shipment)=>({
        sender:shipment.sender,
        receiver:shipment.receiver,
        price:ethers.utils.formatEther(shipment.price.toString()),
        pickUpTime:Number(shipment.pickupTime), //These values are retrieved as BigInt from the smart Contract
        deliveryTime:Number(shipment.deliveryTime),//These values are retrieved as BigInt from the smart Contract
        distance:Number(shipment.distance),//These values are retrieved as BigInt from the smart Contract
        isPaid:shipment.isPaid,
        status:shipment.status
      }));
      return allShipments;
     }catch(err){
      console.log(err);
     }
 }

 const getShipmentsCount=async ()=>{
  try{
      const web3Modal=new Web3Modal();
      const connection=await web3Modal.connect();
      const provider= new ethers.providers.Web3Provider(connection);
      const signer=provider.getSigner();
      const address=signer.getAddress();
      const rpcProvider=new ethers.providers.JsonRpcProvider();
      const contract=fetchContract(rpcProvider);
      const shipmentCount=await contract.getShipmentCount(address);
      return Number(shipmentCount);
  }catch(err){
    console.log(err);
  }
 }
 
 const completeShipment=async (completeShipment:completeShipmentData)=>{
  const {receiver,sender,index}=completeShipment;
  try{
    const web3Modal=new Web3Modal();
    const connection=await web3Modal.connect();
    const provider= new ethers.providers.Web3Provider(connection);
    const signer=provider.getSigner();
    const senderAddress=signer.getAddress();
    const contract=fetchContract(signer);
    const transaction=await contract.completeShipment(receiver,senderAddress,index,{
      gasLimit:30000
    });
    transaction.wait();
    console.log(transaction);
  }catch(err){
    console.log(err);
  };
 }


 

}




