import { ORDER_TYPE_BIDS } from "../constants";

// const round = (value, decimals) => {
//     value = Number(value)
//     if(value < 1) return value.toPrecision(decimals)
//     const integerLength = (value.toFixed(0)).length
//     return value.toPrecision(decimals + integerLength)
//     // return Number(Math.round(value+'e'+decimals)+'e-'+decimals)
// }

// const maxDecimals = (float) => {
//     const value = Math.trunc(float)
//     const length = value.toString().length
//     if(length > 1) {
//         return 2
//     } else {
//         if(value < 1) {
//             return 4
//         } else {
//             return 3
//         }
//     }
// }

const formatOrderBook = (offers, orderType = ORDER_TYPE_BIDS, arrOffers) => {
    // { ASK
    //     "Account": "rsoLoDTcxn9wCEHHBR7enMhzQMThkB2w28",
    //     "BookDirectory": "5C8970D155D65DB8FF49B291D7EFFA4A09F9E8A68D9974B25A1997F7E14CDA39",
    //     "BookNode": "0",
    //     "Expiration": 705140180,
    //     "Flags": 0,
    //     "LedgerEntryType": "Offer",
    //     "OwnerNode": "0",
    //     "PreviousTxnID": "541552841A1ADB8BEA4329DE435F4A9C10C6A0E90626CE1B4AF4D64C8FE26C19",
    //     "PreviousTxnLgrSeq": 71465030,
    //     "Sequence": 67605605,
    //     "TakerGets": {
    //         "currency": "534F4C4F00000000000000000000000000000000",
    //         "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
    //         "value": "124.9311956987916"
    //     },
    //     "TakerPays": "90000000",
    //     "index": "C45796CA3444AB63E507582300662E080E393C40D447C530A435CE8BA86AC6A1",
    //     "owner_funds": "487.6093571004488",
    //     "quality": "720396.5310392889"
    // }

    // { BID
    //     "Account": "rUATLa1awouAR8jS1DwtsXuy8EXCjdktgU",
    //     "BookDirectory": "C73FAC6C294EBA5B9E22A8237AAE80725E85372510A6CA794F04F44BA5C57321",
    //     "BookNode": "0",
    //     "Flags": 131072,
    //     "LedgerEntryType": "Offer",
    //     "OwnerNode": "15",
    //     "PreviousTxnID": "545EB169E174D5BF05F59124B7CCC44BF32BC2DA72A7463459E6CF33121143F0",
    //     "PreviousTxnLgrSeq": 71464668,
    //     "Sequence": 66420966,
    //     "TakerGets": "358550000",
    //     "TakerPays": {
    //         "currency": "534F4C4F00000000000000000000000000000000",
    //         "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
    //         "value": "500"
    //     },
    //     "index": "6857750D3847B6A0D40CCCA1A0FDA609DD54CEECAB088A7A94BD6B65A4834E26",
    //     "owner_funds": "952667088",
    //     "quality": "0.000001394505647747873"
    // }

    if (offers.length < 1) return []

    const getCurrency = offers[0].TakerGets?.currency || 'XRP'
    const payCurrency = offers[0].TakerPays?.currency || 'XRP'
    
    let multiplier = 1
    const isBID = orderType === ORDER_TYPE_BIDS

    // It's the same on each condition?
    if (isBID) {
        if (getCurrency === 'XRP')
            multiplier = 1_000_000
        else if (payCurrency === 'XRP')
            multiplier = 0.000_001
    } else {
        if (getCurrency === 'XRP')
            multiplier = 1_000_000
        else if (payCurrency === 'XRP')
            multiplier = 0.000_001
    }

    // let precision = maxDecimals(isBID ? Math.pow(offers[0].quality * multiplier, -1) : offers[0].quality * multiplier)

    // let index = 0
    const array = []
    let sum = 0;
    let sumGets = 0;
    let sumPays = 0;
    let mapOldOffers = new Map();
    for (var offer of arrOffers) {
        mapOldOffers.set(offer.id, true);
    }


    for (let i = 0; i < offers.length; i++) {
        const offer = offers[i]
        const obj = {
            id: '',
            price: 0,
            amount: 0,
            value: 0,
            sum: 0,
            avgPrice: 0,
            sumGets: 0,
            sumPays: 0,
            isNew: false
        }

        const id = `${offer.Account}:${offer.Sequence}`;
        const gets = offer.taker_gets_funded || offer.TakerGets;
        const pays = offer.taker_pays_funded || offer.TakerPays;
        // const partial = (offer.taker_gets_funded || offer.taker_pays_funded) ? true: false;

        const takerPays = pays.value || pays;
        const takerGets = gets.value || gets;

        const amount = Number(isBID ? takerPays : takerGets)
        const price = isBID ? Math.pow(offer.quality * multiplier, -1) : offer.quality * multiplier

        // const quantity = Number(isBID ? (offer.TakerPays?.value || offer.TakerPays) : (offer.TakerGets?.value || offer.TakerGets))
        // const price = round(isBID ? Math.pow(offer.quality * multiplier, -1) : offer.quality * multiplier, precision)

        // if (i === 0) {
        //     obj.price = price
        //     obj.quantity = quantity
        //     obj.total = quantity
        // } else {
        //     if (array[index].price === price) {
        //         array[index].quantity += quantity
        //         array[index].total += quantity
        //         continue
        //     } else {
        //         obj.price = price
        //         obj.quantity = quantity
        //         obj.total = array[index].total + quantity
        //         index++
        //     }
        // }
        sum += amount;
        
        sumGets += Number(takerGets);
        sumPays += Number(takerPays);

        obj.id = id;
        obj.price = price
        obj.amount = amount
        obj.value = amount * price
        obj.sum = sum
        obj.sumGets = sumGets
        obj.sumPays = sumPays
        if (isBID) {
            if (sumPays > 0)
                obj.avgPrice = sumGets / sumPays
            else
                obj.avgPrice = 0
        } else {
            if (sumGets > 0)
                obj.avgPrice = sumPays / sumGets
            else
                obj.avgPrice = 0
        }
        obj.isNew = !mapOldOffers.has(id)
        //obj.partial = partial

        if (amount > 0)
            array.push(obj)

        // if (i === 0 && isBID)
        //    console.log(offer)

        /*{ BID Offer
            "Account": "rsoLoDTcxn9wCEHHBR7enMhzQMThkB2w28",
            "BookDirectory": "C73FAC6C294EBA5B9E22A8237AAE80725E85372510A6CA794F05DD7327B65E9E",
            "BookNode": "0",
            "Expiration": 705752036,
            "Flags": 0,
            "LedgerEntryType": "Offer",
            "OwnerNode": "0",
            "PreviousTxnID": "8380F74C503D629EE39908E58E702252FE048BFB8FCA3331ED084915EDEB1DDE",
            "PreviousTxnLgrSeq": 71621302,
            "Sequence": 67629249,
            "TakerGets": "90000000",
            "TakerPays": {
                "currency": "534F4C4F00000000000000000000000000000000",
                "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
                "value": "148.5775386714613"
            },
            "index": "862539A8D6773FB25965D788DA7313A11BA2C52535DCA05859149A3A0F8BD565",
            "owner_funds": "524244729",
            "quality": "0.000001650861540794014"
        }*/
    }

    const sortedArrayByPrice = [ ...array ].sort(
        (a, b) => {
            let result = 0;
            if (orderType === ORDER_TYPE_BIDS) {
                result = b.price - a.price;
            } else {
                result = a.price - b.price;
            }
            return result;
        }
    );

    return sortedArrayByPrice.slice(0, 30);
}

export default formatOrderBook