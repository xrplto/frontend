import React, { useEffect, useState } from 'react';
import axios from "axios";
import Table from "components/Table"
import * as normalizer from 'utils/normalizers';
const xrpl = require("xrpl")
const client = new xrpl.Client("ws://95.216.74.17:6005")
const getCurrencyCode = (currency) => {
  let normalizedCode = normalizer.normalizeCurrencyCodeXummImpl(currency);
  if(!normalizedCode || normalizedCode.trim().length == 0)
    return currency
  else
    return normalizedCode
}
let totalData = {} 


const Home = (props) => {
  const [ data, setData ] = useState([])
  const [ issuerData, setIssuerData ] = useState({})
  const main = async () => {
  
    await client.connect()
    try {
      const response = await client.request({
        id: 1,
        command: "ledger_data",
        limit: 100000,
        binary: false,
      })
      console.log(response)     
      loopFuc(response.result.marker, response.result.ledger_hash);    
    } catch(e) {
      console.log(e)
    }
   
    // client.disconnect()
  }

  const addExistingIssuer = (issuer, amount) => {
    let data = totalData[issuer]
    let newAmount = data.amount + amount
    totalData = { ...totalData, [issuer]: { amount:  newAmount, trustlines: ++data.trustlines, offers: data.offers, account: data.account, currency: data.currency}}
    
    // setIssuerData({...totalData});
  }
  const addNewIssuer = (issuer, amount, trustlines, offers, account, currency) => {
    totalData = { ...totalData, [issuer]: { amount: amount, trustlines: trustlines, offers: offers, account: account, currency:  getCurrencyCode(currency)}}
    
    // setIssuerData({...totalData});
  } 
  const addIssuer = async (issuer, amount, account, currency) => {
    
    if(totalData[issuer]) {
      if(totalData[issuer].amount == 0 && amount > 0) {
        //initialize user name to have faster access later on
        // await resolveIssuerInfos(issuer);
      }
      addExistingIssuer(issuer, amount);
    } else {
      // add issuer now but remove him later if the issued value is 0!
      addNewIssuer(issuer, amount, 1, 0, account, currency);

      if(amount > 0) {
        //initialize user name to have faster access later on
        // await resolveIssuerInfos(issuer);
      }
    }
  }
  const resolveIssuerInfos = async (issuer) => {
    await resolveKycStatus(issuer.substring(0, issuer.indexOf("_")));
    await initAccountName(issuer.substring(0, issuer.indexOf("_")));
  }
  async function resolveKycStatus(xrplAccount) {
    try {
        if(!this.kycMap.has(xrplAccount)) {
  
            console.log("RESOLVING KYC FOR: " + xrplAccount);
            let kycResponse = await axios.get("https://xumm.app/api/v1/platform/kyc-status/" + xrplAccount)
            console.log(kycResponse)
            if(kycResponse && kycResponse.ok) {
                let kycInfo = await kycResponse.json();
        
                console.log("resolved: " + JSON.stringify(kycInfo));
                if(kycInfo) {
                    this.kycMap.set(xrplAccount, kycInfo.kycApproved)
                }
  
                console.log("kycMap size: " + this.kycMap.size);
            }
        }
  
        //resolve distributor account status!
        if(this.kycDistributorMap && this.kycDistributorMap.has(xrplAccount) && this.kycDistributorMap.get(xrplAccount) != null && !this.kycMap.has(this.kycDistributorMap.get(xrplAccount))) {
            let distributorAccount = this.kycDistributorMap.get(xrplAccount);
            console.log("resolving kyc for distributor account: " + distributorAccount);
            let kycResponse = await axios.get("https://xumm.app/api/v1/platform/kyc-status/" + distributorAccount)
            
            if(kycResponse && kycResponse.ok) {
                let kycInfo = await kycResponse.json();
        
                console.log("resolved: " + JSON.stringify(kycInfo));
                if(kycInfo) {
                    this.kycMap.set(distributorAccount, kycInfo.kycApproved)
                }
  
                console.log("kycMap size: " + this.kycMap.size);
            }
        }
    } catch(err) {
        console.log("err retrieving kyc status for " + xrplAccount);
        console.log(err);
    }   
  }
  
  const initAccountName = async (xrplAccount) => {
    if(this.bithompServiceNames.has(xrplAccount)) {
        return;
  
    } else if(this.xrpscanUserNames.has(xrplAccount)) {
        return;
    
    } else if(this.bithompUserNames.has(xrplAccount)) {
        return;
  
    } else {
        //try to resolve user name - seems like it is a new one!
        return this.loadBithompSingleAccountName(xrplAccount);
    }
  }
  const loopFuc =  async (marker, hash) => {
    let response = {}, k=2, m="";
    do {
      try {
        response = await client.request({
          id: k,
          command: "ledger_data",
          ledger_hash: hash,
          limit: 100000,
          binary: false,
          marker: m === "" ? marker : m
        })
        console.log("ledger data", k)
        m = response.result.marker
        k = k +1
        let rippleStates = response.result.state.filter(element => element.LedgerEntryType === 'RippleState');
        rippleStates.forEach(item => {
          let amount = Number.parseFloat(item.Balance.value);
          let currency = item.Balance.currency;
          let issuer = null;          
          if(amount > 0) {
            issuer = item.HighLimit.issuer;
          } else if(amount < 0) {
            issuer = item.LowLimit.issuer
          } else {
            //balance is zero. check who has a limit set
            if(Number.parseFloat(item.HighLimit.value) > 0 && Number.parseFloat(item.LowLimit.value) == 0)
              issuer = item.LowLimit.issuer;
            else if(Number.parseFloat(item.LowLimit.value) > 0 && Number.parseFloat(item.HighLimit.value) == 0)
              issuer = item.HighLimit.issuer;
            else 
              issuer = null; //can not determine issuer!
          }  
          if(issuer != null) {  
            amount = amount < 0 ? amount * -1 : amount;
            let issuerKey = issuer + "_" + currency;      
            addIssuer(issuerKey, amount, issuer, currency);
          }
        })
        setIssuerData({...totalData});
      } catch(e) {
        console.log(e)
        break;
      }
    } while(k < 10)

   
  }
  useEffect(() => {
    main();
  }, [])
  return (
    <>
    <Table data={Object.values(issuerData)}/>
    </>
  )
}

export default Home