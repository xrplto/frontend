import React from 'react';
import axios from 'axios';
import FormData from 'form-data';
import { useState, useEffect, useRef } from 'react';

// Material
import {
  styled,
  Avatar,
  Button,
  Card,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  Link,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import ImageIcon from '@mui/icons-material/Image';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import CancelIcon from '@mui/icons-material/Cancel';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';

// Iconify
import { Icon } from '@iconify/react';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Utils
import { fNumber } from 'src/utils/formatNumber';
import { CATEGORIES } from 'src/utils/constants';

// Components
import LoadingTextField from 'src/components/LoadingTextField';
import AddCostDialog from './AddCostDialog';

const CardWrapper = styled('div')(
  ({ theme }) => `
    border: dashed 3px;
    border-radius: 5px;
    padding: 5px;
    width: fit-content;
    &:hover {
        cursor: pointer;
    }
`
);

const CardWrapperCircle = styled('div')(
  ({ theme }) => `
    border: dashed 3px;
    border-radius: 50%;
    padding: 5px;
    width: fit-content;
    overflow: hidden;
    &:hover {
        cursor: pointer;
    }
`
);

const CardWrapper3 = styled('div')(
  ({ theme }) => `
    border: dashed 3px;
    border-radius: 5px;
    padding: 5px;
    // width: fit-content;
    &:hover {
        cursor: pointer;
    }
`
);

const CardOverlay = styled('div')(
  ({ theme }) => `
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: absolute;
    background: black;
    inset: 0;
    opacity: 0;
    z-index: 1;
    transition: opacity 0.5s;
    &:hover {
        opacity: 0.6;
    }
`
);

const CardOverlayCircle = styled('div')(
  ({ theme }) => `
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: absolute;
    background: black;
    inset: 0;
    opacity: 0;
    z-index: 1;
    transition: opacity 0.5s;
    &:hover {
        opacity: 0.6;
    }
`
);

const CustomSelect = styled(Select)(({ theme }) => ({
  '& .MuiOutlinedInput-notchedOutline': {
    border_left: 'none'
  }
}));

export default function CreateCollection({ showHeader = true, onCreate }) {
  const BASE_URL = 'https://api.xrpnft.com/api';

  const fileRef1 = useRef();
  const fileRef2 = useRef();
  const fileRef3 = useRef();
  const fileRef4 = useRef();

  const { accountProfile, openSnackbar } = useContext(AppContext);
  const account = accountProfile?.account;
  const accountToken = accountProfile?.token;

  const [loading, setLoading] = useState(false);

  const [openAddCost, setOpenAddCost] = useState(false);

  // Opensea
  // {
  //     "collections": {
  //         "create": {
  //             "slug": "nft-labsw-1-slug",
  //             "isCategory": false,
  //             "id": "Q29sbGVjdGlvblR5cGU6MTk3MzA2Mzg="
  //         }
  //     }
  // }
  const [name, setName] = useState('');
  const [category, setCategory] = useState('NONE');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('normal');
  const [privateCollection, setPrivateCollection] = useState('no');
  const [bulkUrl, setBulkUrl] = useState('');
  const [costs, setCosts] = useState([]);
  const [taxon, setTaxon] = useState('');
  const [rarity, setRarity] = useState('score');

  // Logo image
  const [fileUrl1, setFileUrl1] = useState(null);
  const [file1, setFile1] = useState(null);
  // Featured image
  const [fileUrl2, setFileUrl2] = useState(null);
  const [file2, setFile2] = useState(null);
  // Banner image
  const [fileUrl3, setFileUrl3] = useState(null);
  const [file3, setFile3] = useState(null);
  // Spinner GIF image
  const [fileUrl4, setFileUrl4] = useState(null);
  const [file4, setFile4] = useState(null);

  const [valid1, setValid1] = useState(false); // Name validation check
  const [valid2, setValid2] = useState(false); // Slug validation check
  const [passphrase, setPassPhrase] = useState('');
  const [validPassword, setValidPassword] = useState(false);

  let canCreate = file1 && name && slug && valid1 && valid2 && validPassword;

  if (type !== 'normal') {
    if (!bulkUrl || costs.length < 1) canCreate = false;
  }

  const getTaxon = () => {
    // https://api.xrpnft.com/api/taxon?account=
    axios
      .get(`${BASE_URL}/taxon/available?account=${account}`)
      .then((res) => {
        try {
          if (res.status === 200 && res.data) {
            const ret = res.data;
            setTaxon(ret.taxon + 1);
          }
        } catch (error) {
          console.log(error);
        }
      })
      .catch((err) => {
        console.log('err->>', err);
      })
      .then(function () {
        // Always executed
      });
  };

  useEffect(() => {
    getTaxon();
  }, []);

  const onCreateCollection = async () => {
    if (!account || !accountToken) {
      openSnackbar('Please login', 'error');
      return;
    }

    setLoading(true);
    try {
      let res;

      const formdata = new FormData();

      let fileFlag = [true, false, false, false];
      formdata.append('imgCollection', file1);
      if (file2) {
        fileFlag[1] = true;
        formdata.append('imgCollection', file2);
      }
      if (file3) {
        fileFlag[2] = true;
        formdata.append('imgCollection', file3);
      }
      if (file4) {
        fileFlag[3] = true;
        formdata.append('imgCollection', file4);
      }

      const data = {};
      data.name = name;
      data.category = category;
      data.slug = slug;
      data.description = description;
      data.fileFlag = fileFlag;
      data.type = type;
      data.rarity = rarity;
      data.private = privateCollection;
      if (type !== 'normal') {
        data.costs = costs;
        data.bulkUrl = bulkUrl;
      }

      data.passphrase = passphrase;

      formdata.append('account', account);
      formdata.append('data', JSON.stringify(data));

      // https://api.xrpnft.com/api/collection/create
      res = await axios.post(`${BASE_URL}/collection/create`, formdata, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-access-token': accountToken
        }
      });

      if (res.status === 200) {
        const ret = res.data;
        if (ret.status) {
          const data = ret.data;
          /*{
                        "name": "FRACTAL-BBB",
                        "externalLink": "",
                        "description": "",
                        "collection": "",
                        "Flags": 13,
                        "Issuer": "rEBKhngY8izMvRrgGg3Yh5zdiQgHH9cExg",
                        "minter": "xrpnft.com",
                        "image": "QmbUaafMaftkUTt44DVdTaSwgKzf51UWMD4NNNc7Jt4fCf",
                        "URI": "516D656A506E6E6775635A5664723637583937324C313842726A366F317241503842794754796137645259763234",
                        "uuid": "d1dcfe3cac80409793629707de2aafbf",
                        "minted": false,
                        "_id": "6308bc3d7a1dec795f21fc33"
                    } */
          openSnackbar('Create collection successful!', 'success');
          onCreate(data.slug);
        } else {
          // { status: false, data: null, err: 'ERR_URL_SLUG' }
          const err = ret.err;
          openSnackbar(err, 'error');
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const processFile = (pickedFile, idx) => {
    if (!pickedFile) return false;

    const fileName = pickedFile.name;
    var re = /(?:\.([^.]+))?$/;
    var ext = re.exec(fileName)[1];
    if (ext) ext = ext.toLowerCase();
    if (ext === 'jpg' || ext === 'png' || ext === 'gif') {
      const size = pickedFile.size;
      if (size < 10240000) {
        // setImgExt(ext);
        if (idx === 1) setFile1(pickedFile);
        else if (idx === 2) setFile2(pickedFile);
        else if (idx === 3) setFile3(pickedFile);
        else if (idx === 4) setFile4(pickedFile);

        // This is used as src of image
        const reader = new FileReader();
        reader.readAsDataURL(pickedFile);
        reader.onloadend = function (e) {
          if (idx === 1)
            setFileUrl1(reader.result); // data:image/jpeg;base64
          else if (idx === 2) setFileUrl2(reader.result);
          else if (idx === 3) setFileUrl3(reader.result);
          else if (idx === 4) setFileUrl4(reader.result);
        };
        return true;
      } else {
        openSnackbar('You can only upload images size less than 10MB', 'error');
      }
    }
    return false;
  };

  const handleFileSelect1 = (e) => {
    const pickedFile = e.target.files[0];
    const ret = processFile(pickedFile, 1);
    if (!ret) fileRef1.current.value = null;
  };

  const handleFileSelect2 = (e) => {
    const pickedFile = e.target.files[0];
    const ret = processFile(pickedFile, 2);
    if (!ret) fileRef2.current.value = null;
  };

  const handleFileSelect3 = (e) => {
    const pickedFile = e.target.files[0];
    const ret = processFile(pickedFile, 3);
    if (!ret) fileRef3.current.value = null;
  };

  const handleFileSelect4 = (e) => {
    const pickedFile = e.target.files[0];
    const ret = processFile(pickedFile, 4);
    if (!ret) fileRef4.current.value = null;
  };

  const handleResetFile1 = (e) => {
    e.stopPropagation();
    setFile1(null);
    setFileUrl1(null);
    fileRef1.current.value = null;
  };

  const handleResetFile2 = (e) => {
    e.stopPropagation();
    setFile2(null);
    setFileUrl2(null);
    fileRef2.current.value = null;
  };

  const handleResetFile3 = (e) => {
    e.stopPropagation();
    setFile3(null);
    setFileUrl3(null);
    fileRef3.current.value = null;
  };

  const handleResetFile4 = (e) => {
    e.stopPropagation();
    setFile4(null);
    setFileUrl4(null);
    fileRef4.current.value = null;
  };

  const handleChangeType = (event, newType) => {
    setType(newType);
  };

  const handleChangePrivate = (event, newValue) => {
    setPrivateCollection(newValue);
  };

  const handleAddCost = (cost) => {
    for (var c of costs) {
      if (c.md5 === cost.md5) {
        c.amount = cost.amount;
        return;
      }
    }
    costs.push(cost);
  };

  const handleRemoveCost = (md5) => {
    const newCosts = [];
    for (var c of costs) {
      if (c.md5 !== md5) newCosts.push(c);
    }
    setCosts(newCosts);
  };

  const handleChangeCategory = (event) => {
    const value = event.target.value;
    setCategory(value);
  };

  const handleChangeRarity = (event) => {
    const value = event.target.value;
    setRarity(value);
  };

  return (
    <>
      <AddCostDialog
        open={openAddCost}
        setOpen={setOpenAddCost}
        openSnackbar={openSnackbar}
        onAddCost={handleAddCost}
      />
      <Stack spacing={1} sx={{ mt: 4, mb: 3 }}>
        {showHeader && <Typography variant="h1a">Create a Collection</Typography>}
        <Typography variant="p2">
          <Typography variant="s2">*</Typography> Required fields
        </Typography>
        <Typography variant="p4" sx={{ pt: 2, pb: 1 }}>
          Logo image <Typography variant="s2">*</Typography>
        </Typography>
        <Typography variant="p3">
          This image will also be used for navigation. 350 x 350 recommended.(Max: 10MB)
        </Typography>
        <CardWrapperCircle>
          <input
            ref={fileRef1}
            style={{ display: 'none' }}
            // accept='image/*,video/*,audio/*,webgl/*,.glb,.gltf'
            // accept='image/*'
            accept=".png, .jpg, .gif"
            id="contained-button-file1"
            // multiple
            type="file"
            onChange={handleFileSelect1}
          />
          <Card
            sx={{
              display: 'flex',
              width: 140,
              height: 140,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '50%',
              position: 'relative'
            }}
          >
            <CardOverlayCircle onClick={() => fileRef1.current.click()}>
              <IconButton
                aria-label="close"
                onClick={(e) => handleResetFile1(e)}
                sx={
                  fileUrl1
                    ? {
                        position: 'absolute',
                        right: '1vw',
                        top: '1vh'
                      }
                    : { display: 'none' }
                }
              >
                <CloseIcon color="white" />
              </IconButton>
            </CardOverlayCircle>
            <img
              src={fileUrl1}
              alt=""
              style={
                fileUrl1
                  ? {
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden'
                    }
                  : { display: 'none' }
              }
            />
            <ImageIcon
              fontSize="large"
              sx={fileUrl1 ? { display: 'none' } : { width: 64, height: 64 }}
            />
          </Card>
        </CardWrapperCircle>
        <Typography variant="p4" sx={{ pt: 2, pb: 1 }}>
          Featured image
        </Typography>
        <Typography variant="p3">
          This image will be used for featuring your collection on the homepage, category pages, or
          other promotional areas of XRPNFT.COM. 600 x 400 recommended.(Max: 10MB)
        </Typography>
        <CardWrapper>
          <input
            ref={fileRef2}
            style={{ display: 'none' }}
            // accept='image/*,video/*,audio/*,webgl/*,.glb,.gltf'
            // accept='image/*'
            accept=".png, .jpg, .gif"
            id="contained-button-file2"
            // multiple
            type="file"
            onChange={handleFileSelect2}
          />
          <Card
            sx={{
              display: 'flex',
              width: 320,
              height: 240,
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'auto',
              position: 'relative'
            }}
          >
            <CardOverlay onClick={() => fileRef2.current.click()}>
              <IconButton
                aria-label="close"
                onClick={(e) => handleResetFile2(e)}
                sx={
                  fileUrl2
                    ? {
                        position: 'absolute',
                        right: '1vw',
                        top: '1vh'
                      }
                    : { display: 'none' }
                }
              >
                <CloseIcon color="white" />
              </IconButton>
            </CardOverlay>
            <img
              src={fileUrl2}
              alt=""
              style={
                fileUrl2
                  ? {
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden'
                    }
                  : { display: 'none' }
              }
            />
            <ImageIcon
              fontSize="large"
              sx={fileUrl2 ? { display: 'none' } : { width: 100, height: 100 }}
            />
          </Card>
        </CardWrapper>

        <Typography variant="p4" sx={{ pt: 2, pb: 1 }}>
          Banner image
        </Typography>
        <Typography variant="p3">
          This image will appear at the top of your collection page. Avoid including too much text
          in this banner image, as the dimensions change on different devices. 1400 x 350
          recommended.(Max: 10MB)
        </Typography>
        <CardWrapper3>
          <input
            ref={fileRef3}
            style={{ display: 'none' }}
            // accept='image/*,video/*,audio/*,webgl/*,.glb,.gltf'
            // accept='image/*'
            accept=".png, .jpg, .gif"
            id="contained-button-file3"
            // multiple
            type="file"
            onChange={handleFileSelect3}
          />
          <Card
            sx={{
              display: 'flex',
              // maxWidth: 700,
              height: 200,
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'auto',
              position: 'relative'
            }}
          >
            <CardOverlay onClick={() => fileRef3.current.click()}>
              <IconButton
                aria-label="close"
                onClick={(e) => handleResetFile3(e)}
                sx={
                  fileUrl3
                    ? {
                        position: 'absolute',
                        right: '1vw',
                        top: '1vh'
                      }
                    : { display: 'none' }
                }
              >
                <CloseIcon color="white" />
              </IconButton>
            </CardOverlay>
            <img
              src={fileUrl3}
              alt=""
              style={
                fileUrl3
                  ? {
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden'
                    }
                  : { display: 'none' }
              }
            />
            <ImageIcon
              fontSize="large"
              sx={fileUrl3 ? { display: 'none' } : { width: 100, height: 100 }}
            />
          </Card>
        </CardWrapper3>

        <Typography variant="p4" sx={{ pt: 2, pb: 1 }}>
          Name <Typography variant="s2">*</Typography>
        </Typography>

        <LoadingTextField
          id="id_collection_name"
          placeholder="Example: My XRPL NFTs"
          type="COLLECTION_NAME"
          startText=""
          value={name}
          setValid={setValid1}
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
      </Stack>
      <Stack spacing={2} mb={3}>
        <Typography variant="p4">Category</Typography>
        <Typography variant="p3">
          This helps your NFT to be found when people search by Category. Once you set, you can not
          change Category when you edit your collection.
        </Typography>
        <CustomSelect
          id="select_category"
          value={category}
          onChange={handleChangeCategory}
          MenuProps={{ disableScrollLock: true }}
        >
          {CATEGORIES.map((cat) => (
            <MenuItem key={cat.title} value={cat.title} sx={{ pt: 2, pb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                {cat.icon}
                <Typography variant="d4">{cat.title}</Typography>
              </Stack>
            </MenuItem>
          ))}
        </CustomSelect>
      </Stack>
      <Stack spacing={2} mb={3}>
        <Typography variant="p4">
          URL <Typography variant="s2">*</Typography>
        </Typography>
        <Typography variant="p3">
          Customize your URL on XRPNFT.COM. Must only contain lowercase letters, numbers, and
          hyphens.
        </Typography>

        <LoadingTextField
          id="id_collection_slug"
          placeholder="my-xrpl-nfts"
          type="COLLECTION_SLUG"
          startText="https://xrpnft.com/collection/"
          value={slug}
          setValid={setValid2}
          onChange={(e) => {
            const value = e.target.value;
            const newSlug = value ? value.replace(/[^a-z0-9-]/g, '') : '';
            setSlug(newSlug);
          }}
        />
      </Stack>
      <Stack spacing={2} mb={3}>
        <Typography variant="p4">
          Type <Typography variant="s2">*</Typography>
        </Typography>
        <Typography variant="p3">Select your collection type.</Typography>

        <Stack spacing={1} pl={0}>
          <Typography variant="p3">
            <Typography variant="s2">Normal:</Typography> You can mint NFTs one by one for this
            collection.
          </Typography>
          <Typography variant="p3">
            <Typography variant="s2">Bulk:</Typography> You can upload bulk NFTs and sell NFTs with
            Mints.
          </Typography>
          <Typography variant="p3">
            <Typography variant="s2">Random:</Typography> You can upload bulk NFTs and sell NFTs
            randomly with Mints.
          </Typography>
          <Typography variant="p3">
            <Typography variant="s2">Sequence:</Typography> You can upload bulk NFTs and sell NFTs
            sequently with Mints.
          </Typography>
        </Stack>

        <ToggleButtonGroup
          color="primary"
          value={type}
          exclusive
          size="small"
          onChange={handleChangeType}
        >
          <ToggleButton value="normal" sx={{ pl: 2, pr: 2 }}>
            Normal
          </ToggleButton>
          <ToggleButton value="bulk" sx={{ pl: 3, pr: 3 }}>
            Bulk
          </ToggleButton>
          <ToggleButton value="random" sx={{ pl: 3, pr: 3 }}>
            Random
          </ToggleButton>
          <ToggleButton value="sequence" sx={{ pl: 3, pr: 3 }}>
            Sequence
          </ToggleButton>
        </ToggleButtonGroup>

        {type !== 'normal' && (
          <>
            <Stack spacing={1}>
              {type === 'bulk' ? (
                <Typography variant="p2">
                  Costs per NFT <Typography variant="s2">*</Typography>
                </Typography>
              ) : (
                <Typography variant="p2">
                  Costs per Mint <Typography variant="s2">*</Typography>
                </Typography>
              )}
              <Typography variant="p3" sx={{ pb: 2 }}>
                You need to add at least 1 currency to create a collection.
              </Typography>

              {costs.map((cost, idx) => (
                <Stack spacing={1} sx={{ pl: 1, pr: 1 }} key={cost.md5}>
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{ mt: 0 }}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Stack direction="row" alignItems="center">
                      <Avatar alt="C" src={`https://s1.xrpl.to/token/${cost.md5}`} sx={{ mr: 2 }} />
                      <Stack spacing={0.5}>
                        <Stack direction="row">
                          <Typography variant="d4">{cost.name}</Typography>
                          <Typography variant="d4" sx={{ ml: 2 }} noWrap>
                            <Typography>✕</Typography> {fNumber(cost.exch)}
                          </Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center">
                          <Typography variant="p3">{cost.issuer}</Typography>
                        </Stack>
                      </Stack>
                    </Stack>

                    <Stack direction="row" spacing={2} alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="flex-end">
                        <Typography variant="p4" color="#EB5757">
                          {cost.amount}
                        </Typography>
                        <Typography variant="s2">{cost.name}</Typography>
                      </Stack>

                      <IconButton onClick={() => handleRemoveCost(cost.md5)}>
                        <HighlightOffOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                  <Divider />
                </Stack>
              ))}

              <Stack direction="row" sx={{ pl: 1, pt: 1, pb: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddCircleIcon />}
                  size="small"
                  onClick={() => setOpenAddCost(true)}
                >
                  Add
                </Button>
              </Stack>
            </Stack>

            <Stack spacing={2} sx={{ pl: 0 }}>
              <Typography variant="p2">
                Paste the Google Drive file shared link URL here.{' '}
                <Typography variant="s2">*</Typography>
              </Typography>
              <Typography variant="p3">
                Upload .zip file contains your NFT images to Google Drive and copy & paste the
                shared link URL.
              </Typography>
              {/* <Typography variant='p3'>
                                https://drive.google.com/file/d/1xjA-1bodiMrvSCtdTEMim5x1Cam74bXU/view
                            </Typography> */}

              <TextField
                id="id_bulk_url"
                placeholder="https://drive.google.com/file/d/1xjA-1dkjiMtvSTcSTEMim5x1Cam74bXU/view"
                value={bulkUrl}
                onChange={(e) => {
                  setBulkUrl(e.target.value);
                }}
              />
            </Stack>

            {(type === 'random' || type === 'sequence') && (
              <>
                <Typography variant="p4" sx={{ pt: 2, pb: 1 }}>
                  Spinner GIF image
                </Typography>
                <Typography variant="p3">
                  This image will be used for spinning NFTs. If you don't select, the &nbsp;
                  <Link
                    target="_blank"
                    href={`/static/spin.gif`}
                    rel="noreferrer noopener nofollow"
                  >
                    default spinning image
                  </Link>
                  &nbsp; will be used. 600 x 400 recommended. (Max: 10MB)
                </Typography>
                <CardWrapper>
                  <input
                    ref={fileRef4}
                    style={{ display: 'none' }}
                    accept=".png, .jpg, .gif"
                    id="contained-button-file4"
                    // multiple
                    type="file"
                    onChange={handleFileSelect4}
                  />
                  <Card
                    sx={{
                      display: 'flex',
                      width: 320,
                      height: 240,
                      justifyContent: 'center',
                      alignItems: 'center',
                      overflow: 'auto',
                      position: 'relative'
                    }}
                  >
                    <CardOverlay onClick={() => fileRef4.current.click()}>
                      <IconButton
                        aria-label="close"
                        onClick={(e) => handleResetFile4(e)}
                        sx={
                          fileUrl4
                            ? {
                                position: 'absolute',
                                right: '1vw',
                                top: '1vh'
                              }
                            : { display: 'none' }
                        }
                      >
                        <CloseIcon color="white" />
                      </IconButton>
                    </CardOverlay>
                    <img
                      src={fileUrl4}
                      alt=""
                      style={
                        fileUrl4
                          ? {
                              objectFit: 'cover',
                              width: '100%',
                              height: '100%',
                              overflow: 'hidden'
                            }
                          : { display: 'none' }
                      }
                    />
                    <ImageIcon
                      fontSize="large"
                      sx={
                        fileUrl4
                          ? { display: 'none' }
                          : {
                              width: 100,
                              height: 100
                            }
                      }
                    />
                  </Card>
                </CardWrapper>
              </>
            )}
          </>
        )}
      </Stack>
      <Stack spacing={2} mb={3}>
        <Typography variant="p4">Description</Typography>
        <Typography variant="p3">
          <Link href="https://www.markdownguide.org/cheat-sheet/">Markdown</Link> syntax is
          supported. 0 of 1000 characters used.
        </Typography>
        <TextField
          placeholder=""
          margin="dense"
          multiline
          maxRows={4}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
          }}
          sx={{
            '&.MuiTextField-root': {
              marginTop: 1,
              minHeight: 10
            },
            '& .MuiOutlinedInput-root': {
              height: 100,
              alignItems: 'start'
            }
          }}
        />
      </Stack>
      <Stack spacing={2} mb={3}>
        <Typography variant="p4">Taxon</Typography>
        <Typography variant="p3">
          Taxon links NFTs to this collection, NFTs minted for this collection will have this Taxon
          in their NFTokenID field. Taxon is automatically set.
        </Typography>

        <TextField id="id_collection_taxon" disabled placeholder="" margin="dense" value={taxon} />
      </Stack>
      <Stack spacing={2} mb={3}>
        <Typography variant="p4">
          Rarity <Typography variant="s2">*</Typography>
        </Typography>
        <Typography variant="p3">
          Select your collection's rarity calculation method.&nbsp;
          <Link
            target="_blank"
            href={`https://raritytools.medium.com/ranking-rarity-understanding-rarity-calculation-methods-86ceaeb9b98c`}
            rel="noreferrer noopener nofollow"
          >
            Read More
          </Link>
        </Typography>

        <Stack spacing={1} pl={0}>
          <Typography variant="p3">
            <Typography variant="s2">Standard:</Typography> Simply compare the rarest trait of each
            NFT(%).
          </Typography>
          <Typography variant="p3">
            <Typography variant="s2">Average:</Typography> Average the rarity of traits that exist
            on the NFT(%).
          </Typography>
          <Typography variant="p3">
            <Typography variant="s2">Statistical:</Typography> Multiply all of its trait rarities
            together(%).
          </Typography>
          <Typography variant="p3">
            <Typography variant="s2">Score:</Typography> Sum of the Rarity Score of all of its trait
            values(not %, just a value).
          </Typography>
          <Typography variant="p3">
            <Typography variant="s2">Self:</Typography> Rarity and Rank are included in each NFT
            metadata.
          </Typography>
        </Stack>

        <FormControl sx={{ ml: 5 }}>
          {/* <FormLabel id="on-sale-sub-filter">On Sale sub</FormLabel> */}
          <RadioGroup
            aria-labelledby="demo-controlled-radio-buttons-group"
            name="controlled-radio-buttons-group"
            value={rarity}
            onChange={handleChangeRarity}
          >
            <FormControlLabel value="standard" control={<Radio />} label="Standard" />
            <FormControlLabel value="average" control={<Radio />} label="Average" />
            <FormControlLabel value="statistical" control={<Radio />} label="Statistical" />
            <FormControlLabel value="score" control={<Radio />} label="Score" />
            <FormControlLabel value="self" control={<Radio />} label="Self" />
          </RadioGroup>
        </FormControl>
      </Stack>
      <Stack spacing={2} mb={3}>
        <Typography variant="p4">
          Private <Typography variant="s2">*</Typography>
        </Typography>
        <Typography variant="p3">
          Make your collection private when you need to upload NFTs or do something private. You can
          make collection public again after you've done all things.
        </Typography>

        <ToggleButtonGroup
          color="primary"
          value={privateCollection}
          exclusive
          size="small"
          onChange={handleChangePrivate}
        >
          <ToggleButton value="no" sx={{ pl: 2, pr: 2, pt: 0.3, pb: 0.3 }}>
            No
          </ToggleButton>
          <ToggleButton value="yes" sx={{ pl: 2, pr: 2, pt: 0.3, pb: 0.3 }}>
            Yes
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Stack spacing={2} mb={3}>
        <Typography variant="p4">
          Passphrase <Typography variant="s2">*</Typography>
        </Typography>
        <Typography variant="p3">
          Contact support to get your own passphrase for your account. Once you get your passphrase,
          you can use it for 10 times only, if you want more, contact support again to get the new
          passphrase.
        </Typography>

        <Link
          href="https://xrpnft.com/discord"
          sx={{ mt: 1.5, display: 'inline-flex' }}
          underline="none"
          target="_blank"
          rel="noreferrer noopener nofollow"
        >
          <Typography variant="s2" color="#33C2FF">
            Contact us on Discord
          </Typography>
        </Link>

        <LoadingTextField
          id="id_create_collection_passphrase"
          type="PASSPHRASE_CREATE_COLLECTION"
          placeholder="Passphrase"
          startText=""
          value={passphrase}
          setValid={setValidPassword}
          onChange={(e) => {
            setPassPhrase(e.target.value);
          }}
        />
      </Stack>
      <Stack alignItems="right">
        <LoadingButton
          disabled={!canCreate}
          variant="contained"
          loading={loading}
          loadingPosition="start"
          startIcon={<SendIcon />}
          onClick={onCreateCollection}
          sx={{ mt: 5, mb: 6 }}
        >
          Create
        </LoadingButton>
      </Stack>
    </>
  );
}
