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

const formatOrderBook = (offers, reverse) => {
    if(offers.length < 1) return []

    const getCurrency = offers[0].TakerGets?.currency || 'XRP'
    const payCurrency = offers[0].TakerPays?.currency || 'XRP'
    
    let multiplier = 1
    if(reverse) {
        if(getCurrency === 'XRP') multiplier = 1_000_000
        else if(payCurrency === 'XRP') multiplier = 0.000_001
    } else {
        if(getCurrency === 'XRP') multiplier = 1_000_000
        else if(payCurrency === 'XRP') multiplier = 0.000_001
    }

    let precision = maxDecimals(reverse ? Math.pow(offers[0].quality * multiplier, -1) : offers[0].quality * multiplier)

    let index = 0
    const array = []
    for(let i = 0; offers.length > i; i++) {
        const offer = offers[i]
        const obj = {
            price: 0,
            quantity: 0,
            total: 0
        }

        var quantity = reverse ? (offer.TakerPays?.value || offer.TakerPays) : (offer.TakerGets?.value || offer.TakerGets)       

        if(i === 0) {
            obj.price = round(reverse ? Math.pow(offer.quality * multiplier, -1) : offer.quality * multiplier, precision)
            obj.quantity = Number(quantity)
            obj.total = Number(quantity)
        } else {
            const price = round(reverse ? Math.pow(offer.quality * multiplier, -1) : offer.quality * multiplier, precision)
            if(array[index].price === price) {
                array[index].quantity = Number(array[index].quantity) + Number(quantity)
                array[index].total = Number(array[index].total) + Number(quantity)
                continue
            } else {
                obj.price = price
                obj.quantity = Number(quantity)
                obj.total = Number(array[index].total) + Number(quantity)
                index++
            }
        }
        array.push(obj)
    }
    return array
}

export default formatOrderBook