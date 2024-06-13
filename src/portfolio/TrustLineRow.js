import { Avatar, Stack, TableCell, TableRow, Typography } from "@mui/material";
import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "src/AppContext";

const TrustLineRow = ({ idx, currencyName, balance, md5 }) => {

    const { darkMode } = useContext(AppContext);
    // const [imgUrl, setImgUrl] = useState("");

    // useEffect(() => {
    //     if (currencyName) {
    //         getTokenDetail();
    //     }
    // }, [currencyName]);

    // const getTokenDetail = async() => {
    //     const BASE_URL = process.env.API_URL;
    //     const res = await axios.get(`${BASE_URL}/token/${currencyName.toLowerCase()}?desc=yes`);
    //     const { md5 } = res.data.token;
    //     const _imgUrl = `https://s1.xrpl.to/token/${md5}`;
    //     setImgUrl(_imgUrl);
    // }

    return (
        <TableRow
            sx={{
                '&:hover': {
                    '& .MuiTableCell-root': {
                        backgroundColor: darkMode
                            ? '#232326 !important'
                            : '#D9DCE0 !important'
                    }
                },
            }}
        >

            <TableCell
                align="left"
            >
                <Typography variant="s6" noWrap>
                    {idx}
                </Typography>
            </TableCell>

            <TableCell align="left" sx={{ py: 1}}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar src={`https://s1.xrpl.to/token/${md5}`} sx={{ width: 32, height: 32 }}/>
                    <Typography variant="s6" noWrap>
                        {currencyName}
                    </Typography>
                </Stack>
            </TableCell>

            <TableCell align="left">
                <Typography variant="s6" noWrap>
                    {balance}
                </Typography>
            </TableCell>

        </TableRow>
    )
}

export default TrustLineRow;