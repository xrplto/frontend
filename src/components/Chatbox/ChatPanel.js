import {  Stack, Avatar, styled, Paper } from "@mui/material";

const chats = [
    {
        text: "Xrpl.to is so cool platform",
        time: 1719999999999
    },
    {
        text: "Xrpl.to is so cool platform",
        time: 1719999999999
    },
    {
        text: "Xrpl.to is so cool platform",
        time: 1719999999999
    },
    {
        text: "Xrpl.to is so cool platform",
        time: 1719999999999
    },
    {
        text: "Xrpl.to is so cool platform",
        time: 1719999999999
    },
    {
        text: "Xrpl.to is so cool platform",
        time: 1719999999999
    },
    {
        text: "Xrpl.to is so cool platform",
        time: 1719999999999
    },
    {
        text: "Xrpl.to is so cool platform",
        time: 1719999999999
    },
];

const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
}));

const ChatPanel = () => {

    return (
        <Stack gap={2}>
            {
                chats.map((chat, index) => (
                    <Stack key={index} direction="row" spacing={1} alignItems="center">
                        <Avatar alt="Remy Sharp" src="/static/crossmark.webp" sx={{ width: 36, height: 36 }}/>
                        <Item>{chat.text}</Item>
                    </Stack>
                ))
            }
        </Stack>
    )
}

export default ChatPanel;