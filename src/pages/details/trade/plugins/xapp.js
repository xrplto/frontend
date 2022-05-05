import axios from 'redaxios'

let tokenData
let jwt
let curatedAssets

const apiEndPoint = 'https://xumm.app/api/v1/xapp-jwt'
const apiKey = process.env.VUE_APP_XAPP_KEY

const headers = () => {
    return { headers: { Authorization: `Bearer ${jwt}` } }
}

const getTokenData = async (ott) => {
    if(!tokenData) {
        try {
            const res = await axios.get(`${apiEndPoint}/authorize`, { headers: { 'x-api-key': apiKey, 'x-api-ott': ott } })
            tokenData = res.data.ott
            jwt = res.data.jwt
            return tokenData
        } catch(e) {
            throw 'Error getting Token Data'
        }
    } else {
        return tokenData
    }    
}

const sendCommandtoXumm = (command) => {
    if (typeof window.ReactNativeWebView === 'undefined') throw new Error('This is not a react native webview')
    window.ReactNativeWebView.postMessage(JSON.stringify(command))
}

const openSignRequest = (uuid) => {
    try {
        sendCommandtoXumm({
            command: 'openSignRequest',
            uuid: uuid
        })
    } catch(e) {
        throw e
    }
}

const closeXapp = () => {
    try {
        sendCommandtoXumm({
            command: "close",
            refreshEvents: false
        })
    } catch(e) {
        throw e
    }
}

const openExternalBrowser = (url) => {
    try {
        sendCommandtoXumm({
            command: 'openBrowser',
            url: url
        })
    } catch(e) {
        throw e
    }
}

const openTxViewer = (tx, account) => {
    try {
        sendCommandtoXumm({
            command: 'txDetails',
            tx,
            account
        })
    } catch(e) {
        throw e
    }
}

const getCuratedAssets = async () => {
    if(curatedAssets && Object.keys(curatedAssets).length > 0 && curatedAssets.constructor === Object) return curatedAssets
    try {
        const res = await axios.get(`${apiEndPoint}/curated-assets`, headers())
        curatedAssets = res.data
        return curatedAssets
    } catch(e) {
        throw e
    }
}

const status = () => {
    return new Promise((resolve, reject) => {
        function message(event) {
            window.removeEventListener("message", message)
            document.removeEventListener("message", message)

            const data = JSON.parse(event.data)
            if(data.method !== 'payloadResolved') return reject('')
            if(data.reason === 'SIGNED') return resolve()
            else return reject('')
        }
        //iOS
        window.addEventListener('message', message)
        //Android
        document.addEventListener('message', message)
    })
}

const payload = async (payload) => {
    try {
        const res = await axios.post(`${apiEndPoint}/payload`, payload, headers())
        openSignRequest(res.data.uuid)
        await status()
        const result = await axios.get(`${apiEndPoint}/payload/${res.data.uuid}`, headers())
        return result
    } catch(e) {
        if (e === '') throw { msg: 'closed', error: false }
        throw e
    }
}

const setUserData = async (key, payloadJSON) => {
    try {
        await axios.post(`${apiEndPoint}/userdata/${key}`, payloadJSON, headers())
    } catch(e) {
        console.error('Post userData to XUMM:', e)
        throw e
    }
}

const getUserData = async (key) => {
    try {
        const res = await axios.get(`${apiEndPoint}/userdata/${key}`, headers())
        return res.data.data
    } catch(e) {
        console.error('Get userData from XUMM:', e)
        throw e
    }
}

const versionCheck = (v1, v2) => {
    var v1parts = v1.split('.');
    var v2parts = v2.split('.');

    // First, validate both numbers are true version numbers
    function validateParts(parts) {
        for (var i = 0; i < parts.length; ++i) {
            if (!/^\d+$/.test(parts[i])) {
                return false;
            }
        }
        return true;
    }
    if (!validateParts(v1parts) || !validateParts(v2parts)) {
        return NaN;
    }

    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length === i) {
            return 1;
        }

        if (v1parts[i] === v2parts[i]) {
            continue;
        }
        if (v1parts[i] > v2parts[i]) {
            return 1;
        }
        return -1;
    }

    if (v1parts.length != v2parts.length) {
        return -1;
    }

    return 0;
}

export default {
    getTokenData,
    closeXapp,
    signPayload: payload,
    getCuratedAssets,
    openExternalBrowser,
    openTxViewer,
    setUserData,
    getUserData,
    versionCheck
}

// export default {
//     install: (app, options) => {
//         const urlParams = new URLSearchParams(window.location.search)
//         const ott = urlParams.get('xAppToken')
//         const theme = urlParams.get('xAppStyle') || 'MOONLIGHT'

//         const themeStyles = {
//             '--var-white': '#FFFFFF',
//             '--var-black': '#000000',
//             '--var-blue': '#3052FF',
//             '--var-lightblue': '#F3F5FF',
//             '--var-orange': '#F8BF4C',
//             '--var-lightorange': '#FFFBF4',
//             '--var-green': '#3BDC96',
//             '--var-lightgreen': '#F3FDF9',
//             '--var-red': '#FF5B5B',
//             '--var-lightred': '#FFF5F5',

//             '--var-silver': '#ACB1C1',
//             '--var-lightgrey': '#f1f1f1',

//             '--var-txt-light': '#FFF',
//             '--var-txt-dark': '#000',

//             '--var-LIGHT': '#FFFFFF',
//             '--var-DARK': '#000000',
//             '--var-MOONLIGHT': '#181A21',
//             '--var-ROYAL': '#030B36',

//             '--red': '#fa4c50',
//             '--green': '#24ae64',

//             '--var-bg-color': `var(--var-${theme})`,
//             '--var-txt-color': theme === 'LIGHT' ? 'var(--var-txt-dark)' : 'var(--var-txt-light)',
//             '--var-primary': theme === 'LIGHT' ? 'var(--var-blue)' : 'var(--var-orange)',
//             '--var-secondary': theme === 'LIGHT' ? 'var(--var-silver)' : 'var(--var-black)',

//             '--var-border': theme === 'LIGHT' ? 'var(--var-silver)' : 'rgba(255, 255, 255, 0.26)',
//             '--var-backdrop': theme === 'LIGHT' ? '255, 255, 255' : '0, 0, 0',

//             'background-color': 'var(--var-bg-color)',
//             'color': 'var(--var-txt-color)'
//         }
//     }
// }