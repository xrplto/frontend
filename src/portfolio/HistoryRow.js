import { Chip } from "@mui/material";
import { useEffect, useState } from "react";
import {
    useTheme,
    TableCell,
    TableRow,
} from '@mui/material';
import numeral from "numeral";

const HistoryRow = (props) => {

    const {
        TransactionType,
        Amount,
        Amount2,
        Asset,
        Asset2,
        TransactionResult,
        DeliveredAmount,
        SendMax,
        hash,
        date
    } = props;
    const theme = useTheme();

    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];
    const rippleEpochTimeStamp = +date + 946684800;
    const rippleEpoch = new Date(rippleEpochTimeStamp * 1000);

    const month = monthNames[rippleEpoch.getMonth()];
    const day = rippleEpoch.getDate();
    const hours = ("0" + rippleEpoch.getHours()).slice(-2); // Add leading zero and take last two characters
    const minutes = ("0" + rippleEpoch.getMinutes()).slice(-2); // Add leading zero and take last two characters
    const seconds = ("0" + rippleEpoch.getSeconds()).slice(-2); // Add leading zero and take last two characters;

    const formattedDate =
        month + " " + day + ", " + hours + ":" + minutes + ":" + seconds;

    const handleViewClick = () => {
        window.open(`https://xrpscan.com/tx/${hash}`, "_blank");
    };

    const hexToText = (hex) => {
        let text = "";
        for (let i = 0; i < hex.length; i += 2) {
            text += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return text;
    };
    const convertDemurrageToUTF8 = (demurrageCode) => {
        const bytes = Buffer.from(demurrageCode, "hex");
        const code =
            String.fromCharCode(bytes[1]) +
            String.fromCharCode(bytes[2]) +
            String.fromCharCode(bytes[3]);
        const interest_start =
            (bytes[4] << 24) + (bytes[5] << 16) + (bytes[6] << 8) + bytes[7];
        const interest_period = bytes.readDoubleBE(8);
        const year_seconds = 31536000; // By convention, the XRP Ledger's interest/demurrage rules use a fixed number of seconds per year (31536000), which is not adjusted for leap days or leap seconds
        const interest_after_year =
            Math.E **
            ((interest_start + year_seconds - interest_start) / interest_period);
        const interest = interest_after_year * 100 - 100;

        return `${code} (${interest}% pa)`;
    };
    const normalizeCurrencyCode = (currencyCode) => {
        if (currencyCode === "XRP") return "XRP";

        if (
            currencyCode?.length === 3 &&
            currencyCode.trim().toLowerCase() !== "xrp"
        ) {
            // "Standard" currency code
            return currencyCode.trim();
        }

        if (
            currencyCode.match(/^[a-fA-F0-9]{40}$/) &&
            !isNaN(parseInt(currencyCode, 16))
        ) {
            // Hexadecimal currency code
            const hex = currencyCode.toString().replace(/(00)+$/g, "");
            if (hex.startsWith("01")) {
                // Old demurrage code. https://xrpl.org/demurrage.html
                return convertDemurrageToUTF8(currencyCode);
            }
            if (hex.startsWith("02")) {
                // XLS-16d NFT Metadata using XLS-15d Concise Transaction Identifier
                // https://github.com/XRPLF/XRPL-Standards/discussions/37
                const xlf15dBuffer = Buffer.from(hex, "hex").subarray(8);
                const decoder = new TextDecoder("utf-8");
                const xlf15d = decoder.decode(xlf15dBuffer).trim();
                if (xlf15d.match(/[a-zA-Z0-9]{3,}/) && xlf15d.toLowerCase() !== "xrp") {
                    return xlf15d;
                }
            }
            return hexToText(hex);
        }
        return "";
    };

    const getFormat = (value) => {
        const valueString = value.toString();
        const valueParts = valueString.split(".");
        const valueBeforeDot = numeral(valueParts[0]).format("0,0");
        const valueAfterDot = valueParts[1]?.substring(0, 6) || "";
        return {
            valueBeforeDot,
            valueAfterDot
        };
    };

    const [assetName, setAssetName] = useState("");
    const [assetValue, setAssetValue] = useState({
        valueBeforeDot: "",
        valueAfterDot: ""
    });
    const [assetColor1, setAssetColor1] = useState("");
    const [assetName2, setAssetName2] = useState("");
    const [assetValue2, setAssetValue2] = useState({
        valueBeforeDot: "",
        valueAfterDot: ""
    });
    const [assetColor2, setAssetColor2] = useState("");

    useEffect(() => {
        if (TransactionType === "AMMDeposit") {
            if (Amount?.currency && Amount?.value) {
                setAssetName(normalizeCurrencyCode(Amount.currency));
                setAssetValue(getFormat(Number(Amount.value)));
            } else {
                setAssetName("XRP");
                setAssetValue(getFormat(Number(Amount) / 1000000));
            }

            if (Amount2?.currency && Amount2?.value) {
                setAssetName2(normalizeCurrencyCode(Amount2.currency));
                setAssetValue2(getFormat(Number(Amount2.value)));
            } else {
                setAssetName2("XRP");
                setAssetValue2(getFormat(Number(Amount2) / 1000000));
            }
        }

        if (TransactionType === "AMMWithdraw") {
            if (Asset.currency) {
                setAssetName(normalizeCurrencyCode(Asset.currency));
            }
            if (Asset2.currency) {
                setAssetName2(normalizeCurrencyCode(Asset2.currency));
            }

            if (Amount?.value) {
                setAssetValue(getFormat(Number(Amount.value)));
            } else {
                setAssetValue(getFormat(Number(Amount) / 1000000));
            }
            if (Amount2?.value) {
                setAssetValue2(getFormat(Number(Amount2.value)));
            } else {
                setAssetValue2(getFormat(Number(Amount2) / 1000000));
            }
        }

        if (TransactionType === "Payment") {
            if (SendMax.currency && SendMax.value) {
                setAssetName(normalizeCurrencyCode(SendMax.currency));
                setAssetValue(getFormat(Number(SendMax.value)));
                if (SendMax.currency === "MAG") setAssetColor1("text-blue-500");
                else if (typeof Amount === "string") setAssetColor1("text-[#de0f3e]");
                else setAssetColor1("text-[#009b0a]");
            } else {
                setAssetName("XRP");
                setAssetColor1("text-blue-500");
                setAssetValue(getFormat(Number(SendMax) / 1000000));
            }

            if (DeliveredAmount.currency && DeliveredAmount.value) {
                setAssetName2(normalizeCurrencyCode(DeliveredAmount.currency));
                setAssetValue2(getFormat(Number(DeliveredAmount.value)));
                if (
                    DeliveredAmount.currency === "XRP" ||
                    DeliveredAmount.currency === "MAG"
                )
                    setAssetColor2("text-blue-500");
                else if (typeof Amount === "string") setAssetColor2("text-[#de0f3e]");
                else setAssetColor2("text-[#009b0a]");
            } else {
                setAssetName2("XRP");
                setAssetColor2("text-blue-500");
                setAssetValue2(getFormat(Number(DeliveredAmount) / 1000000));
            }
        }
    }, [TransactionType]);

    const getRelativeTime = (timestamp) => {
        const now = new Date();
        const timeDiff = now.getTime() - timestamp.getTime();
        const seconds = Math.floor(timeDiff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ago`;
        } else if (hours > 0) {
            return `${hours}h ago`;
        } else if (minutes > 0) {
            return `${minutes}m ago`;
        } else {
            return `${seconds}s ago`;
        }
    };

    return (
        <TableRow>
            <TableCell sx={{ color: theme.palette.text.primary }}>
                {TransactionType === "Payment" &&
                    // <p className="text-[#eeeeee]">{t("swap")}</p>
                    (typeof Amount !== "string" ? (
                        
                        <Chip color="success" label="Buy"/>
                    ) : (
                        <span className="inline-flex items-center rounded-md bg-[#de0f3e] px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-red-600/10">
                            Sell
                        </span>
                    ))}
                {TransactionType === "AMMDeposit" && (
                    // <p className="text-[#eeeeee]">{t("amm deposit")}</p>
                    <span className="inline-flex items-center rounded-md bg-purple-700 px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-green-600/20">
                        Add
                    </span>
                )}
                {TransactionType === "AMMWithdraw" && (
                    // <p className="text-[#eeeeee]">{t("amm withdraw")}</p>
                    <span className="inline-flex items-center rounded-md bg-yellow-700 px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-green-600/20">
                        Remove
                    </span>
                )}
            </TableCell>
            <TableCell sx={{ color: theme.palette.text.primary }}></TableCell>
            <TableCell sx={{ color: theme.palette.text.primary }}></TableCell>
            <TableCell sx={{ color: theme.palette.text.primary }}></TableCell>
            <TableCell>
                
            </TableCell>
        </TableRow>
    )
}

export default HistoryRow;