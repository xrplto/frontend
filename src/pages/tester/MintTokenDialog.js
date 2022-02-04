//import { useEffect, useState } from 'react';
import { useState } from 'react';
//import PropTypes from 'prop-types';
//import { Icon } from '@iconify/react';
// material
//import { alpha, useTheme, styled } from '@mui/material/styles';
import { 
//    Button, 
//    Paper, 
    Dialog, 
//    DialogTitle, 
//    DialogActions, 
//    Divider,
    Alert,
    AlertTitle
} from '@mui/material';
// ----------------------------------------------------------------------
const xrpl = require("xrpl");
async function mintToken(showResult, showWaitDialog, values) {
    showWaitDialog(true);
    let res = null;
    let tmp;
    try {
        const wallet = xrpl.Wallet.fromSeed(values.secret)
        const client = new xrpl.Client("wss://xls20-sandbox.rippletest.net:51233")
        await client.connect()
        console.log("Connected to Sandbox")

        // Note that you must convert the token URL to a hexadecimal
        // value for this transaction.
        // ----------------------------------------------------------
        const transactionBlob = {
            TransactionType: "NFTokenMint",
            Account: wallet.classicAddress,
            URI: xrpl.convertStringToHex(values.tokenUrl),
            Flags: parseInt(values.flags),
            TokenTaxon: 0 //Required, but if you have no use for it, set to zero.
        }
        // Submit signed blob --------------------------------------------------------
        const tx = await client.submitAndWait(transactionBlob,{wallet})

        const nfts = await client.request({
            method: "account_nfts",
            account: wallet.classicAddress
        })
        console.log(nfts)
        tmp = tx.result.meta.TransactionResult;
        // Check transaction results -------------------------------------------------
        console.log("Transaction result:", tmp)
        console.log("Balance changes:", JSON.stringify(xrpl.getBalanceChanges(tx.result.meta), null, 2))
        client.disconnect()
        res = tmp;
    } catch (error) {
        console.log(error);
        res = null;
    }
    showWaitDialog(false);
    // {
    //     "id": 5,
    //     "result": {
    //         "account": "rht9PFsHK2rds9dp5Nt9op4VWAceR63vWH",
    //         "account_nfts": [
    //             {
    //                 "Flags": 1,
    //                 "Issuer": "rht9PFsHK2rds9dp5Nt9op4VWAceR63vWH",
    //                 "TokenID": "000100002A94990787E3CAC4B6B755080CE6D410A69A459D0000099B00000000",
    //                 "TokenTaxon": 0,
    //                 "URI": "697066733A2F2F516D585353704861473944483555377A514E6B4C34425A72425A696F474733786D4735346D715071544370646451",
    //                 "nft_serial": 0
    //             },
    //             {
    //                 "Flags": 1,
    //                 "Issuer": "rht9PFsHK2rds9dp5Nt9op4VWAceR63vWH",
    //                 "TokenID": "000100002A94990787E3CAC4B6B755080CE6D410A69A459D16E5DA9C00000001",
    //                 "TokenTaxon": 0,
    //                 "URI": "697066733A2F2F516D585353704861473944483555377A514E6B4C34425A72425A696F474733786D4735346D715071544370646451",
    //                 "nft_serial": 1
    //             },
    //             {
    //                 "Flags": 1,
    //                 "Issuer": "rht9PFsHK2rds9dp5Nt9op4VWAceR63vWH",
    //                 "TokenID": "000100002A94990787E3CAC4B6B755080CE6D410A69A459D2DCBAB9D00000002",
    //                 "TokenTaxon": 0,
    //                 "URI": "697066733A2F2F516D585353704861473944483555377A514E6B4C34425A72425A696F474733786D4735346D715071544370646451",
    //                 "nft_serial": 2
    //             },
    //             {
    //                 "Flags": 1,
    //                 "Issuer": "rht9PFsHK2rds9dp5Nt9op4VWAceR63vWH",
    //                 "TokenID": "000100002A94990787E3CAC4B6B755080CE6D410A69A459D44B17C9E00000003",
    //                 "TokenTaxon": 0,
    //                 "URI": "697066733A2F2F516D585353704861473944483555377A514E6B4C34425A72425A696F474733786D4735346D715071544370646451",
    //                 "nft_serial": 3
    //             },
    //             {
    //                 "Flags": 1,
    //                 "Issuer": "rht9PFsHK2rds9dp5Nt9op4VWAceR63vWH",
    //                 "TokenID": "000100002A94990787E3CAC4B6B755080CE6D410A69A459D5B974D9F00000004",
    //                 "TokenTaxon": 0,
    //                 "URI": "697066733A2F2F516D585353704861473944483555377A514E6B4C34425A72425A696F474733786D4735346D715071544370646451",
    //                 "nft_serial": 4
    //             }
    //         ],
    //         "ledger_current_index": 417333,
    //         "validated": false
    //     },
    //     "type": "response"
    // }
    // Transaction result: tesSUCCESS
    // Balance changes: [
    //     {
    //       "account": "rht9PFsHK2rds9dp5Nt9op4VWAceR63vWH",
    //       "balances": [
    //         {
    //           "currency": "XRP",
    //           "value": "-0.000012"
    //         }
    //       ]
    //     }
    //   ]
    //res = "tesSUCCESS";
    showResult(res);
} //End of mintToken

// ----------------------------------------------------------------------
export default function MintTokenDialog({ values, setLoading, render }) {
    const [open, setOpen] = useState(false);
    const [res, setRes] = useState();
    
    const onMintToken = () => {
        mintToken(showResult, setLoading, values);
     };

    const showResult = (response) => {
        setOpen(true);
        setRes(response);
     };
    
    const handleClose = () => {
        setOpen(false);
    };

    // const handleOk = () => {
    //     handleClose();
    // };

    return (
        <>
        {render(onMintToken)}
        <Dialog onClose={handleClose} open={open}>
            {res===null
                ?<Alert severity="error"variant="outlined">
                    <AlertTitle>Error</AlertTitle>
                    Please check your address
                    </Alert>
                :<Alert
                    variant="outlined"
                    severity="success">
                    <AlertTitle>{values.account}</AlertTitle>
                    <br/>
                    Minting successful!
                    <br/>
                </Alert>
            }
        </Dialog>
        </>
    );
}


    