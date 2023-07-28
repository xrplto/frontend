import { Tooltip } from '@mui/material';



export default function NumberTooltip({ number, prepend = '', pos = 'top' }) {
	let numberTrim = number;
	if (numberTrim < 1 && numberTrim.toString().length > 10 && !numberTrim.toString().includes('e')) {
		//console.log('NumberTooltip', number);
		numberTrim = '0.0...' + number.slice(-4);
	} else {
		return number;// if small enough return untrimmed
	}
	return (
		<Tooltip title={prepend + number} placement={pos} arrow>
		  <span>{prepend}{numberTrim}</span>
		</Tooltip>
	);
}