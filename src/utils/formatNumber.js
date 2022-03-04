import { replace } from 'lodash';
import numeral from 'numeral';

// ----------------------------------------------------------------------

export function fCurrency(number) {
    return numeral(number).format(Number.isInteger(number) ? '0,0' : '0,0.00');
}

export function fCurrency3(number) {
    return numeral(number).format(Number.isInteger(number) ? '0,0' : '0,0.000');
}

const f = (v, threshold = .999) => {
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

export function fCurrency5(number) {
    if (number < 1)
        return f(number);
    else {
        const res = numeral(number).format(Number.isInteger(number) ? '0,0' : '0,0.00');
        if (res === 'NaN') return 0;
        return res;
    }
}

export function fPercent(number) {
    return numeral(number / 100).format('0.0%');
}

export function fNumber(number) {
    return numeral(number).format();
}

export function fShortenNumber(number) {
    return replace(numeral(number).format('0.00a'), '.00', '');
}

export function fData(number) {
    return numeral(number).format('0.0 b');
}
