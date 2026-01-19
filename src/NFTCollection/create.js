import React from 'react';
import axios from 'axios';
import { useState, useEffect, useRef, useContext } from 'react';
import { Image as ImageIcon, Send, X, Plus, XCircle, CheckCircle, AlertCircle, Loader } from 'lucide-react';

// Context
import { AppContext } from 'src/AppContext';

// Utils
import { fNumber } from 'src/utils/formatters';
import { cn } from 'src/utils/cn';

// Components
import { ClipLoader } from 'src/components/Spinners';
import AddCostDialog from './AddCostDialog';

// LoadingTextField component (inlined)
const LoadingTextField = ({ type, value, uuid, setValid, startText, ...props }) => {
  const TEXT_EMPTY = 0;
  const TEXT_CHECKING = 1;
  const TEXT_VALID = 2;
  const TEXT_INVALID = 3;

  const BASE_URL = 'https://api.xrpl.to/v1';
  const [status, setStatus] = useState(TEXT_EMPTY);

  const { accountProfile } = useContext(AppContext);

  const checkValidation = (text, uuid) => {
    const account = accountProfile?.account;
    const accountToken = accountProfile?.token;
    if (!account || !accountToken) return;

    setStatus(TEXT_CHECKING);

    const body = {};
    body.account = account;
    body.text = text;
    body.type = type;
    if (uuid) body.uuid = uuid;

    axios
      .post(`${BASE_URL}/validation`, body, { headers: { 'x-access-token': accountToken } })
      .then((res) => {
        try {
          if (res.status === 200 && res.data) {
            const ret = res.data.status;

            if (ret) setStatus(TEXT_VALID);
            else setStatus(TEXT_INVALID);
          }
        } catch (error) {
          setStatus(TEXT_INVALID);
        }
      })
      .catch((err) => {
        setStatus(TEXT_INVALID);
      })
      .then(function () {
        // Always executed
      });
  };

  useEffect(() => {
    const handleValue = () => {
      if (!value) setStatus(TEXT_EMPTY);
      else checkValidation(value, uuid);
    };

    setValid(false);
    handleValue();
  }, [value, uuid]);

  useEffect(() => {
    if (setValid) {
      if (status === TEXT_VALID) setValid(true);
      else setValid(false);
    }
  }, [status, setValid]);

  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  return (
    <div className="mx-2 my-1">
      <div className="relative">
        {startText && (
          <span className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-[13px]",
            isDark ? "text-white/60" : "text-gray-600"
          )}>
            {startText}
          </span>
        )}
        <input
          {...props}
          value={value}
          autoComplete="new-password"
          className={cn(
            "w-full rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal outline-none transition-colors",
            startText && "pl-[200px]",
            isDark
              ? "border-white/15 bg-transparent text-white placeholder:text-white/40 focus:border-primary"
              : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary"
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {status === TEXT_CHECKING && <ClipLoader color="#ff0000" size={15} />}
          {status === TEXT_VALID && <CheckCircle size={18} className="text-green-500" />}
          {status === TEXT_INVALID && <AlertCircle size={18} className="text-red-500" />}
        </div>
      </div>
    </div>
  );
};

// LoadingButton component (inlined)
const LoadingButton = ({
  loading = false,
  loadingPosition = 'center',
  children,
  disabled,
  startIcon,
  endIcon,
  onClick,
  className
}) => {
  const isDisabled = disabled || loading;
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const getStartIcon = () => {
    if (loading && loadingPosition === 'start') {
      return <Loader size={18} className="animate-spin" />;
    }
    return startIcon;
  };

  const getEndIcon = () => {
    if (loading && loadingPosition === 'end') {
      return <Loader size={18} className="animate-spin" />;
    }
    return endIcon;
  };

  const getChildren = () => {
    if (loading && loadingPosition === 'center' && !startIcon && !endIcon) {
      return <Loader size={18} className="animate-spin" />;
    }
    return children;
  };

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal transition-colors",
        isDisabled
          ? "cursor-not-allowed opacity-40"
          : isDark
            ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
            : "border-primary bg-primary text-white hover:bg-primary/90",
        className
      )}
    >
      {getStartIcon()}
      {getChildren()}
      {getEndIcon()}
    </button>
  );
};

// Constants
const CATEGORIES = [
  { title: 'Art', icon: '🎨' },
  { title: 'Gaming', icon: '🎮' },
  { title: 'Music', icon: '🎵' },
  { title: 'Photography', icon: '📷' },
  { title: 'Sports', icon: '⚽' },
  { title: 'Collectibles', icon: '🎯' },
  { title: 'Utility', icon: '🔧' },
  { title: 'Metaverse', icon: '🌐' }
];

export default function CreateCollection({ showHeader = true, onCreate }) {
  const BASE_URL = 'https://api.xrpl.to/v1';

  const fileRef1 = useRef();
  const fileRef2 = useRef();
  const fileRef3 = useRef();
  const fileRef4 = useRef();

  const { accountProfile, openSnackbar, themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const account = accountProfile?.account;
  const accountToken = accountProfile?.token;

  const [loading, setLoading] = useState(false);

  const [openAddCost, setOpenAddCost] = useState(false);

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
  const [passphrase, setPassphrase] = useState('');
  const [validPassword, setValidPassword] = useState(false);

  let canCreate = file1 && name && slug && valid1 && valid2 && validPassword;

  if (type !== 'normal') {
    if (!bulkUrl || costs.length < 1) canCreate = false;
  }

  const getTaxon = () => {
    axios
      .get(`${BASE_URL}/taxon/available?account=${account}`)
      .then((res) => {
        try {
          if (res.status === 200 && res.data) {
            const ret = res.data;
            setTaxon(ret.taxon + 1);
          }
        } catch (error) {
        }
      })
      .catch((err) => {
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

      res = await axios.post(`${BASE_URL}/nfts/create`, formdata, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-access-token': accountToken
        }
      });

      if (res.status === 200) {
        const ret = res.data;
        if (ret.status) {
          const data = ret.data;
          openSnackbar('Create collection successful!', 'success');
          onCreate(data.slug);
        } else {
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
        if (idx === 1) setFile1(pickedFile);
        else if (idx === 2) setFile2(pickedFile);
        else if (idx === 3) setFile3(pickedFile);
        else if (idx === 4) setFile4(pickedFile);

        const reader = new FileReader();
        reader.readAsDataURL(pickedFile);
        reader.onloadend = function (e) {
          if (idx === 1)
            setFileUrl1(reader.result);
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

  const handleChangeType = (newType) => {
    setType(newType);
  };

  const handleChangePrivate = (newValue) => {
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

  const handleChangeCategory = (value) => {
    setCategory(value);
  };

  const handleChangeRarity = (value) => {
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
      <div className="mt-8 mb-6 space-y-2">
        {showHeader && <h1 className="text-2xl font-normal">Create a Collection</h1>}
        <p className="text-[13px]">
          <span className="text-red-500">*</span> Required fields
        </p>

        <div className="pt-4 pb-2">
          <p className="text-[15px] font-normal mb-2">
            Logo image <span className="text-red-500">*</span>
          </p>
          <p className="text-[13px] mb-4">
            This image will also be used for navigation. 350 x 350 recommended.(Max: 10MB)
          </p>

          <div className={cn(
            "border-[3px] border-dashed rounded-full p-1 w-fit cursor-pointer",
            isDark ? "border-white/20" : "border-gray-300"
          )}>
            <input
              ref={fileRef1}
              style={{ display: 'none' }}
              accept=".png, .jpg, .gif"
              id="contained-button-file1"
              type="file"
              onChange={handleFileSelect1}
            />
            <div
              className="relative flex items-center justify-center w-[140px] h-[140px] rounded-full overflow-hidden cursor-pointer"
              style={{
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
              }}
            >
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black opacity-0 hover:opacity-60 transition-opacity z-10"
                onClick={() => fileRef1.current.click()}
              >
                <button
                  onClick={(e) => handleResetFile1(e)}
                  className={cn(
                    "absolute right-2 top-2",
                    fileUrl1 ? "block" : "hidden"
                  )}
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
              {fileUrl1 ? (
                <img
                  src={fileUrl1}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon size={64} className={isDark ? "text-white/20" : "text-gray-300"} />
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 pb-2">
          <p className="text-[15px] font-normal mb-2">Featured image</p>
          <p className="text-[13px] mb-4">
            This image will be used for featuring your collection on the homepage, category pages, or
            other promotional areas of XRPNFT.COM. 600 x 400 recommended.(Max: 10MB)
          </p>

          <div className={cn(
            "border-[3px] border-dashed rounded-xl p-1 w-fit cursor-pointer",
            isDark ? "border-white/20" : "border-gray-300"
          )}>
            <input
              ref={fileRef2}
              style={{ display: 'none' }}
              accept=".png, .jpg, .gif"
              id="contained-button-file2"
              type="file"
              onChange={handleFileSelect2}
            />
            <div
              className="relative flex items-center justify-center w-[320px] h-[240px] rounded-lg overflow-hidden cursor-pointer"
              style={{
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
              }}
            >
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black opacity-0 hover:opacity-60 transition-opacity z-10"
                onClick={() => fileRef2.current.click()}
              >
                <button
                  onClick={(e) => handleResetFile2(e)}
                  className={cn(
                    "absolute right-2 top-2",
                    fileUrl2 ? "block" : "hidden"
                  )}
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
              {fileUrl2 ? (
                <img
                  src={fileUrl2}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon size={100} className={isDark ? "text-white/20" : "text-gray-300"} />
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 pb-2">
          <p className="text-[15px] font-normal mb-2">Banner image</p>
          <p className="text-[13px] mb-4">
            This image will appear at the top of your collection page. Avoid including too much text
            in this banner image, as the dimensions change on different devices. 1400 x 350
            recommended.(Max: 10MB)
          </p>

          <div className={cn(
            "border-[3px] border-dashed rounded-xl p-1 cursor-pointer",
            isDark ? "border-white/20" : "border-gray-300"
          )}>
            <input
              ref={fileRef3}
              style={{ display: 'none' }}
              accept=".png, .jpg, .gif"
              id="contained-button-file3"
              type="file"
              onChange={handleFileSelect3}
            />
            <div
              className="relative flex items-center justify-center h-[200px] rounded-lg overflow-hidden cursor-pointer"
              style={{
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
              }}
            >
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black opacity-0 hover:opacity-60 transition-opacity z-10"
                onClick={() => fileRef3.current.click()}
              >
                <button
                  onClick={(e) => handleResetFile3(e)}
                  className={cn(
                    "absolute right-2 top-2",
                    fileUrl3 ? "block" : "hidden"
                  )}
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
              {fileUrl3 ? (
                <img
                  src={fileUrl3}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon size={100} className={isDark ? "text-white/20" : "text-gray-300"} />
              )}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <p className="text-[15px] font-normal mb-2">
            Name <span className="text-red-500">*</span>
          </p>

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
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <p className="text-[15px] font-normal">Category</p>
        <p className="text-[13px]">
          This helps your NFT to be found when people search by Category. Once you set, you can not
          change Category when you edit your collection.
        </p>
        <select
          id="select_category"
          value={category}
          onChange={(e) => handleChangeCategory(e.target.value)}
          className={cn(
            "w-full rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal outline-none",
            isDark
              ? "border-white/15 bg-transparent text-white"
              : "border-gray-300 bg-white text-gray-900"
          )}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.title} value={cat.title}>
              {cat.icon} {cat.title}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 space-y-4">
        <p className="text-[15px] font-normal">
          URL <span className="text-red-500">*</span>
        </p>
        <p className="text-[13px]">
          Customize your URL on XRPNFT.COM. Must only contain lowercase letters, numbers, and
          hyphens.
        </p>

        <LoadingTextField
          id="id_collection_slug"
          placeholder="my-xrpl-nfts"
          type="COLLECTION_SLUG"
          startText="https://xrpnft.com/nfts/"
          value={slug}
          setValid={setValid2}
          onChange={(e) => {
            const value = e.target.value;
            const newSlug = value ? value.replace(/[^a-z0-9-]/g, '') : '';
            setSlug(newSlug);
          }}
        />
      </div>

      <div className="mb-6 space-y-4">
        <p className="text-[15px] font-normal">
          Type <span className="text-red-500">*</span>
        </p>
        <p className="text-[13px]">Select your collection type.</p>

        <div className="space-y-2 pl-0">
          <p className="text-[13px]">
            <span className="text-red-500 font-medium">Normal:</span> You can mint NFTs one by one for this
            collection.
          </p>
          <p className="text-[13px]">
            <span className="text-red-500 font-medium">Bulk:</span> You can upload bulk NFTs and sell NFTs with
            Mints.
          </p>
          <p className="text-[13px]">
            <span className="text-red-500 font-medium">Random:</span> You can upload bulk NFTs and sell NFTs
            randomly with Mints.
          </p>
          <p className="text-[13px]">
            <span className="text-red-500 font-medium">Sequence:</span> You can upload bulk NFTs and sell NFTs
            sequently with Mints.
          </p>
        </div>

        <div className="flex gap-2">
          {['normal', 'bulk', 'random', 'sequence'].map((t) => (
            <button
              key={t}
              onClick={() => handleChangeType(t)}
              className={cn(
                "rounded-lg border-[1.5px] px-4 py-1 text-[13px] font-normal capitalize transition-colors",
                type === t
                  ? "border-primary bg-primary/10 text-primary"
                  : isDark
                    ? "border-white/15 text-white hover:border-primary"
                    : "border-gray-300 text-gray-900 hover:border-primary"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {type !== 'normal' && (
          <>
            <div className="space-y-2">
              {type === 'bulk' ? (
                <p className="text-[14px] font-normal">
                  Costs per NFT <span className="text-red-500">*</span>
                </p>
              ) : (
                <p className="text-[14px] font-normal">
                  Costs per Mint <span className="text-red-500">*</span>
                </p>
              )}
              <p className="text-[13px] pb-4">
                You need to add at least 1 currency to create a collection.
              </p>

              {costs.map((cost, idx) => (
                <div key={cost.md5} className="space-y-2 px-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={`https://s1.xrpl.to/token/${cost.md5}`}
                        alt="C"
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-4">
                          <span className="text-[14px]">{cost.name}</span>
                          <span className="text-[14px]">✕ {fNumber(cost.exch)}</span>
                        </div>
                        <p className="text-[13px]">{cost.issuer}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-end gap-1">
                        <span className="text-[15px] text-red-500">{cost.amount}</span>
                        <span className="text-[11px]">{cost.name}</span>
                      </div>

                      <button onClick={() => handleRemoveCost(cost.md5)}>
                        <XCircle size={20} className={isDark ? "text-white/60" : "text-gray-600"} />
                      </button>
                    </div>
                  </div>
                  <div className={cn(
                    "h-[1px]",
                    isDark ? "bg-white/10" : "bg-gray-200"
                  )} />
                </div>
              ))}

              <div className="flex pt-2 pb-6 px-2">
                <button
                  onClick={() => setOpenAddCost(true)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border-[1.5px] px-3 py-1 text-[13px] font-normal",
                    isDark
                      ? "border-white/15 text-white hover:border-primary"
                      : "border-gray-300 text-gray-900 hover:border-primary"
                  )}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>

            <div className="space-y-4 pl-0">
              <p className="text-[14px] font-normal">
                Paste the Google Drive file shared link URL here.{' '}
                <span className="text-red-500">*</span>
              </p>
              <p className="text-[13px]">
                Upload .zip file contains your NFT images to Google Drive and copy & paste the
                shared link URL.
              </p>

              <input
                id="id_bulk_url"
                placeholder="https://drive.google.com/file/d/1xjA-1dkjiMtvSTcSTEMim5x1Cam74bXU/view"
                value={bulkUrl}
                onChange={(e) => {
                  setBulkUrl(e.target.value);
                }}
                className={cn(
                  "w-full rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal outline-none",
                  isDark
                    ? "border-white/15 bg-transparent text-white placeholder:text-white/40"
                    : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                )}
              />
            </div>

            {(type === 'random' || type === 'sequence') && (
              <>
                <p className="text-[15px] font-normal mb-2 pt-4">Spinner GIF image</p>
                <p className="text-[13px] mb-4">
                  This image will be used for spinning NFTs. If you don't select, the &nbsp;
                  <a
                    target="_blank"
                    href={`/static/spin.gif`}
                    rel="noreferrer noopener nofollow"
                    className="text-primary hover:underline"
                  >
                    default spinning image
                  </a>
                  &nbsp; will be used. 600 x 400 recommended. (Max: 10MB)
                </p>
                <div className={cn(
                  "border-[3px] border-dashed rounded-xl p-1 w-fit cursor-pointer",
                  isDark ? "border-white/20" : "border-gray-300"
                )}>
                  <input
                    ref={fileRef4}
                    style={{ display: 'none' }}
                    accept=".png, .jpg, .gif"
                    id="contained-button-file4"
                    type="file"
                    onChange={handleFileSelect4}
                  />
                  <div
                    className="relative flex items-center justify-center w-[320px] h-[240px] rounded-lg overflow-hidden cursor-pointer"
                    style={{
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
                    }}
                  >
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black opacity-0 hover:opacity-60 transition-opacity z-10"
                      onClick={() => fileRef4.current.click()}
                    >
                      <button
                        onClick={(e) => handleResetFile4(e)}
                        className={cn(
                          "absolute right-2 top-2",
                          fileUrl4 ? "block" : "hidden"
                        )}
                      >
                        <X size={20} className="text-white" />
                      </button>
                    </div>
                    {fileUrl4 ? (
                      <img
                        src={fileUrl4}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={100} className={isDark ? "text-white/20" : "text-gray-300"} />
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="mb-6 space-y-4">
        <p className="text-[15px] font-normal">Description</p>
        <p className="text-[13px]">
          <a href="https://www.markdownguide.org/cheat-sheet/" className="text-primary hover:underline">Markdown</a> syntax is
          supported. 0 of 1000 characters used.
        </p>
        <textarea
          placeholder=""
          rows={4}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
          }}
          className={cn(
            "w-full rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal outline-none resize-none",
            isDark
              ? "border-white/15 bg-transparent text-white placeholder:text-white/40"
              : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
          )}
        />
      </div>

      <div className="mb-6 space-y-4">
        <p className="text-[15px] font-normal">Taxon</p>
        <p className="text-[13px]">
          Taxon links NFTs to this collection, NFTs minted for this collection will have this Taxon
          in their NFTokenID field. Taxon is automatically set.
        </p>

        <input
          id="id_collection_taxon"
          disabled
          placeholder=""
          value={taxon}
          className={cn(
            "w-full rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal outline-none",
            isDark
              ? "border-white/15 bg-white/5 text-white/40"
              : "border-gray-300 bg-gray-100 text-gray-500"
          )}
        />
      </div>

      <div className="mb-6 space-y-4">
        <p className="text-[15px] font-normal">
          Rarity <span className="text-red-500">*</span>
        </p>
        <p className="text-[13px]">
          Select your collection's rarity calculation method.&nbsp;
          <a
            target="_blank"
            href={`https://raritytools.medium.com/ranking-rarity-understanding-rarity-calculation-methods-86ceaeb9b98c`}
            rel="noreferrer noopener nofollow"
            className="text-primary hover:underline"
          >
            Read More
          </a>
        </p>

        <div className="space-y-2 pl-0">
          <p className="text-[13px]">
            <span className="text-red-500 font-medium">Standard:</span> Simply compare the rarest trait of each
            NFT(%).
          </p>
          <p className="text-[13px]">
            <span className="text-red-500 font-medium">Average:</span> Average the rarity of traits that exist
            on the NFT(%).
          </p>
          <p className="text-[13px]">
            <span className="text-red-500 font-medium">Statistical:</span> Multiply all of its trait rarities
            together(%).
          </p>
          <p className="text-[13px]">
            <span className="text-red-500 font-medium">Score:</span> Sum of the Rarity Score of all of its trait
            values(not %, just a value).
          </p>
          <p className="text-[13px]">
            <span className="text-red-500 font-medium">Self:</span> Rarity and Rank are included in each NFT
            metadata.
          </p>
        </div>

        <div className="ml-10 space-y-2">
          {['standard', 'average', 'statistical', 'score', 'self'].map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={r}
                checked={rarity === r}
                onChange={(e) => handleChangeRarity(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-[13px] capitalize">{r}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <p className="text-[15px] font-normal">
          Private <span className="text-red-500">*</span>
        </p>
        <p className="text-[13px]">
          Make your collection private when you need to upload NFTs or do something private. You can
          make collection public again after you've done all things.
        </p>

        <div className="flex gap-2">
          {['no', 'yes'].map((p) => (
            <button
              key={p}
              onClick={() => handleChangePrivate(p)}
              className={cn(
                "rounded-lg border-[1.5px] px-4 py-1 text-[13px] font-normal capitalize transition-colors",
                privateCollection === p
                  ? "border-primary bg-primary/10 text-primary"
                  : isDark
                    ? "border-white/15 text-white hover:border-primary"
                    : "border-gray-300 text-gray-900 hover:border-primary"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <p className="text-[15px] font-normal">
          Passphrase <span className="text-red-500">*</span>
        </p>
        <p className="text-[13px]">
          Contact support to get your own passphrase for your account. Once you get your passphrase,
          you can use it for 10 times only, if you want more, contact support again to get the new
          passphrase.
        </p>

        <a
          href="https://xrpnft.com/discord"
          className="inline-block text-primary hover:underline text-[11px] mt-3"
          target="_blank"
          rel="noreferrer noopener nofollow"
        >
          Contact us on Discord
        </a>

        <LoadingTextField
          id="id_create_collection_passphrase"
          type="PASSPHRASE_CREATE_COLLECTION"
          placeholder="Passphrase"
          startText=""
          value={passphrase}
          setValid={setValidPassword}
          onChange={(e) => {
            setPassphrase(e.target.value);
          }}
        />
      </div>

      <div className="flex justify-end mt-10 mb-12">
        <LoadingButton
          disabled={!canCreate}
          loading={loading}
          loadingPosition="start"
          startIcon={<Send size={18} />}
          onClick={onCreateCollection}
        >
          Create
        </LoadingButton>
      </div>
    </>
  );
}
