import numeral from 'numeral';

// ----------------------------------------------------------------------
/*function processBigNumber(number, language, currency = undefined) {
    const { num, unit } = formatLargeNumber(Number(number), 2);
    let numberString = unit ? `${num} ${unit}` : `${num}`;
    if (number.toString().includes('e')) {
        numberString = Number(number)
            .toExponential(2)
            .toString();
    }
    if (currency)
        return `${getLocalizedCurrencySymbol(language, currency)} ${numberString}`;
    return numberString;
}*/

export function fNumber(num) {
    if (!num) return 0;

    const strNum = num.toString().trim();
    const intNum = num - (num % 1);

    if (strNum.includes('e')) {
        if (strNum.length > 5)
            return Number(strNum).toExponential(5);
        return num;
    }

    if (intNum.toString().length > 10)
        return Number(strNum).toExponential(5);

    return fCurrency5(num);
}

export function fCurrency(number) {
    return numeral(number).format(Number.isInteger(number) ? '0,0' : '0,0.00');
}

export function fCurrency3(number) {
    return numeral(number).format(Number.isInteger(number) ? '0,0' : '0,0.000');
}

const f = (v, threshold = .9999) => {
    let shift = 1;
    let part;
    
    do {
      shift *= 10;
      part = Math.floor(v * shift) / shift;
    } while (part / v < threshold);
    
    return part;
}

export function limitNumber(number) {
        const res = numeral(number).format(Number.isInteger(number) ? '0,0' : '0,0.00');
        if (res === 'NaN')
            return 0;
        return number;
}

export function fIntNumber(number) {
    return numeral(number).format('0,0');
}

export function fCurrency5(number) {
    if (number < 1)
        return f(number);
    else {
        const res = numeral(number).format(Number.isInteger(number) ? '0,0' : '0,0.00');
        if (res === 'NaN') return 0;
        return res;
    }
}

const fp = (v, threshold = .99) => {
    let shift = 1;
    let part;
    
    do {
      shift *= 10;
      part = Math.floor(v * shift) / shift;
    } while (part / v < threshold);
    
    return part;
}

export function fPercent(number) {
    if (number < 1)
        return fp(number);
    else {
        const strNum = number.toFixed(0).trim();
        if (strNum.length > 5)
            return Number(number).toExponential(0);

        const res = numeral(number).format(Number.isInteger(number) ? '0,0' : '0,0.0');
        if (res === 'NaN') return 0;
        return res;
    }
}

export function fData(number) {
    return numeral(number).format('0.0 b');
}
