import { MOBILE_WIDTH, ORDER_TYPE_ASKS, ORDER_TYPE_BIDS } from "./constants";

const round = (value, decimals) => {
    value = Number(value)
    if(value < 1) return value.toPrecision(decimals)
    const integerLength = (value.toFixed(0)).length
    return value.toPrecision(decimals + integerLength)
    // return Number(Math.round(value+'e'+decimals)+'e-'+decimals)
}

const maxDecimals = (float) => {
    const value = Math.trunc(float)
    const length = value.toString().length
    if(length > 1) {
        return 2
    } else {
        if(value < 1) {
            return 4
        } else {
            return 3
        }
    }
}

const formatOrderBook = (offers, orderType = ORDER_TYPE_BIDS) => {
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
    // It's the same on each condition?
    if (orderType === ORDER_TYPE_BIDS) {
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

    let precision = maxDecimals(orderType === ORDER_TYPE_BIDS ? Math.pow(offers[0].quality * multiplier, -1) : offers[0].quality * multiplier)

    let index = 0
    const array = []
    let total = 0;
    for (let i = 0; i < offers.length; i++) {
        const offer = offers[i]
        const obj = {
            id: `${offer.Account}:${offer.Sequence}`,
            price: 0,
            quantity: 0,
            amount: 0,
            total: 0,
            partial: false
        }

        const gets = offer.taker_gets_funded || offer.TakerGets;
        const pays = offer.taker_pays_funded || offer.TakerPays;
        const partial = (offer.taker_gets_funded || offer.taker_pays_funded) ? true: false;

        const takerPays = pays.value || pays;
        const takerGets = gets.value || gets;

        const quantity = Number(orderType === ORDER_TYPE_BIDS ? takerPays : takerGets)
        const price = orderType === ORDER_TYPE_BIDS ? Math.pow(offer.quality * multiplier, -1) : offer.quality * multiplier

        const takerGetsA = offer.TakerGets.value || offer.TakerGets;
        const takerPaysA = offer.TakerPays.value || offer.TakerPays;

        const quantityA = Number(orderType === ORDER_TYPE_BIDS ? takerPaysA : takerGetsA)

        // const quantity = Number(orderType === ORDER_TYPE_BIDS ? (offer.TakerPays?.value || offer.TakerPays) : (offer.TakerGets?.value || offer.TakerGets))
        // const price = round(orderType === ORDER_TYPE_BIDS ? Math.pow(offer.quality * multiplier, -1) : offer.quality * multiplier, precision)

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
        total += quantity;
        obj.price = price
        obj.quantity = quantity
        obj.quantityA = quantityA;
        obj.amount = quantity * price
        obj.total = total
        obj.partial = partial

        if (quantity > 0)
            array.push(obj)
    }
    return array
}

export default formatOrderBook