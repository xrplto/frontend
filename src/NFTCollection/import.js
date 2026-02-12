import React from 'react';
import api from 'src/utils/api';
import { useState, useEffect, useRef, useContext } from 'react';
import {
  Image as ImageIcon,
  Send,
  X,
  XCircle as CancelIcon,
  PlusCircle as AddCircleIcon,
  XOctagon as HighlightOffOutlinedIcon,
  User as PermIdentityIcon,
  ArrowDownUp as ImportExportIcon,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Loader
import { ClipLoader } from '../components/Spinners';

// Context
import { ThemeContext, WalletContext, AppContext } from 'src/context/AppContext';

// Utils
import { fNumber } from 'src/utils/formatters';
import AddCostDialog from './AddCostDialog';
import { cn } from 'src/utils/cn';

// LoadingTextField component (inlined)
const LoadingTextField = ({ type, value, uuid, setValid, startText, ...props }) => {
  const TEXT_EMPTY = 0;
  const TEXT_CHECKING = 1;
  const TEXT_VALID = 2;
  const TEXT_INVALID = 3;

  const BASE_URL = 'https://api.xrpl.to/v1';
  const [status, setStatus] = useState(TEXT_EMPTY);

  const { accountProfile } = useContext(WalletContext);
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';

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

    api
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

  return (
    <div className="mx-2 my-1">
      <div className="relative">
        {startText && (
          <span
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 text-[13px]',
              isDark ? 'text-white/60' : 'text-gray-600'
            )}
          >
            {startText}
          </span>
        )}
        <input
          {...props}
          value={value}
          autoComplete="new-password"
          className={cn(
            'w-full rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal outline-none transition-colors',
            startText && 'pl-[200px]',
            isDark
              ? 'border-white/15 bg-transparent text-white placeholder:text-white/40 focus:border-[#137DFE]'
              : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#137DFE]'
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
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const getStartIcon = () => {
    if (loading && loadingPosition === 'start') {
      return <ClipLoader color="inherit" size={18} />;
    }
    return startIcon;
  };

  const getEndIcon = () => {
    if (loading && loadingPosition === 'end') {
      return <ClipLoader color="inherit" size={18} />;
    }
    return endIcon;
  };

  const getChildren = () => {
    if (loading && loadingPosition === 'center' && !startIcon && !endIcon) {
      return <ClipLoader color="inherit" size={18} />;
    }
    return children;
  };

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal transition-colors',
        isDisabled
          ? 'cursor-not-allowed opacity-40'
          : isDark
            ? 'border-[#137DFE] bg-[#137DFE]/10 text-[#137DFE] hover:bg-[#137DFE]/20'
            : 'border-[#137DFE] bg-[#137DFE] text-white hover:bg-[#137DFE]/90',
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

export default function ImportCollection() {
  const BASE_URL = 'https://api.xrpl.to/v1';

  const fileRef1 = useRef();
  const fileRef2 = useRef();
  const fileRef3 = useRef();
  const fileRef4 = useRef();

  const { themeName } = useContext(ThemeContext);
  const { accountProfile } = useContext(WalletContext);
  const { openSnackbar } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const accountAdmin = accountProfile?.account;
  const accountToken = accountProfile?.token;

  const [loading, setLoading] = useState(false);

  const [loadingTaxons, setLoadingTaxons] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('NONE');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('normal');
  const [privateCollection, setPrivateCollection] = useState('no');

  const [issuer, setIssuer] = useState('');
  const [taxons, setTaxons] = useState([]);

  const [selectedTaxons, setSelectedTaxons] = useState([]);
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

  const [valid1, setValid1] = useState(false); // Name validation check
  const [valid2, setValid2] = useState(false); // Slug validation check
  const [passphrase, setPassphrase] = useState('');
  const [validPassword, setValidPassword] = useState(true);

  let canImport =
    file1 && issuer && name && slug && valid1 && valid2 && validPassword && taxons.length > 0;

  const getTaxons = (issuer) => {
    if (!accountAdmin || !accountToken) {
      openSnackbar('Please login', 'error');
      return;
    }

    setLoadingTaxons(true);

    api
      .get(`${BASE_URL}/taxon/issuer/${issuer}`, {
        headers: {
          'x-access-account': accountAdmin,
          'x-access-token': accountToken
        }
      })
      .then((res) => {
        try {
          if (res.status === 200 && res.data) {
            const ret = res.data;
            setTaxons(ret.taxons);
          }
        } catch (error) {}
      })
      .catch((err) => {})
      .then(function () {
        // Always executed
        setLoadingTaxons(false);
      });
  };

  useEffect(() => {
    if (!issuer) {
      setTaxons([]);
      setSelectedTaxons([]);
    } else {
      getTaxons(issuer);
    }
  }, [issuer]);

  const onImportCollection = async () => {
    if (!accountAdmin || !accountToken) {
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

      const data = {};
      data.name = name;
      data.category = category;
      data.slug = slug;
      data.description = description;
      data.fileFlag = fileFlag;
      // data.type = type;
      data.private = privateCollection;
      data.taxon = selectedTaxons;
      data.rarity = rarity;

      data.passphrase = passphrase;

      formdata.append('issuer', issuer);
      formdata.append('account', accountAdmin);
      formdata.append('data', JSON.stringify(data));

      // https://api.xrpl.to/v1/nfts/import
      res = await api.post(`${BASE_URL}/nfts/import`, formdata, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-access-account': accountAdmin,
          'x-access-token': accountToken
        }
      });

      if (res.status === 200) {
        const ret = res.data;
        if (ret.status) {
          const data = ret.data;
          openSnackbar('Import collection successful!', 'success');
          window.location.href = `/congrats/importcollection/${data.slug}`;
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

        const reader = new FileReader();
        reader.readAsDataURL(pickedFile);
        reader.onloadend = function (e) {
          if (idx === 1)
            setFileUrl1(reader.result);
          else if (idx === 2) setFileUrl2(reader.result);
          else if (idx === 3) setFileUrl3(reader.result);
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

  const handleChangeType = (newType) => {
    // setType(newType);
  };

  const handleChangePrivate = (newValue) => {
    setPrivateCollection(newValue);
  };

  const handleChangeCategory = (value) => {
    setCategory(value);
  };

  const handleListItemClick = (event, newTaxon) => {
    setSelectedTaxons((prev) => {
      const tempTaxons = [...prev];
      const existingIndex = tempTaxons.findIndex((t) => t === newTaxon);
      if (existingIndex > -1) {
        tempTaxons.splice(existingIndex, 1);
      } else {
        tempTaxons.push(newTaxon);
      }

      return tempTaxons;
    });
  };

  const handleChangeIssuer = (e) => {
    setIssuer(e.target.value);
  };

  const handleChangeRarity = (value) => {
    setRarity(value);
  };

  const handleClickSelectAllTaxons = (isSelectAll = true) => {
    setSelectedTaxons(isSelectAll ? taxons.map((t) => t.taxon) : []);
  };

  return (
    <>
      <div className="mt-8 mb-6 space-y-2">
        <h1 className="text-2xl font-normal">Import a Collection</h1>
        <p className="text-[13px]">
          <span className="text-red-500">*</span> Required fields
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <p className="text-[15px] font-normal">
          Issuer <span className="text-red-500">*</span>
        </p>
        <p className="text-[13px]">
          Input Issuer address that you want to import collection.
        </p>
        <p className="text-[13px]">ex. rJeBz69krYh8sXb8uKsEE22ADzbi1Z4yF2</p>

        <div className="relative">
          <span
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 flex items-center',
              isDark ? 'text-white/60' : 'text-gray-600'
            )}
          >
            <PermIdentityIcon size={20} />
          </span>
          <input
            id="textIssuer"
            className={cn(
              'w-full rounded-lg border-[1.5px] pl-10 pr-10 py-2 text-[13px] font-normal outline-none transition-colors',
              isDark
                ? 'border-white/15 bg-transparent text-white placeholder:text-white/40 focus:border-[#137DFE]'
                : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#137DFE]'
            )}
            placeholder="Issuer Address"
            onChange={handleChangeIssuer}
            autoComplete="off"
            value={issuer}
            onFocus={(event) => {
              event.target.select();
            }}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {loadingTaxons && <ClipLoader color="#ff0000" size={15} />}
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-[15px] font-normal">
            Taxons <span className="text-red-500">*</span>
          </p>
          <button
            disabled={!taxons || taxons.length === 0}
            onClick={() => handleClickSelectAllTaxons(taxons.length !== selectedTaxons.length)}
            className={cn(
              'rounded-lg border-[1.5px] px-3 py-1 text-[13px] font-normal transition-colors',
              !taxons || taxons.length === 0
                ? 'cursor-not-allowed opacity-40'
                : isDark
                  ? 'border-white/15 text-white hover:border-[#137DFE]'
                  : 'border-gray-300 text-gray-900 hover:border-[#137DFE]'
            )}
          >
            {taxons.length > 0 && taxons.length === selectedTaxons.length
              ? 'Unselect All'
              : 'Select All'}
          </button>
        </div>
        <p className="text-[13px]">Select taxon that you want to import.</p>

        {(!taxons || taxons.length === 0) && (
          <div className="flex justify-center">
            <span className="text-xs">[ Input issuer address to get Taxons list ]</span>
          </div>
        )}

        {taxons?.map((tx, idx) => {
          return (
            <div key={tx.taxon}>
              {idx > 0 && (
                <div className={cn('h-px my-2', isDark ? 'bg-white/10' : 'bg-gray-200')} />
              )}
              <button
                className={cn(
                  'w-full text-left py-4 px-3 rounded-lg transition-colors',
                  selectedTaxons.includes(tx.taxon)
                    ? isDark
                      ? 'bg-[#137DFE]/10'
                      : 'bg-[#137DFE]/5'
                    : isDark
                      ? 'hover:bg-white/5'
                      : 'hover:bg-gray-100'
                )}
                onClick={(event) => handleListItemClick(event, tx.taxon)}
              >
                <div className="flex flex-row gap-4 items-center">
                  <span className="text-[13px]">{idx + 1}. </span>
                  <span className="text-sm">Taxon:</span>
                  <span className="text-[13px] text-[#33C2FF] truncate">
                    {tx.taxon}{' '}
                  </span>
                  <span className="text-sm">NFTs:</span>
                  <span className="text-[13px] text-[#33C2FF] truncate">
                    {tx.count}{' '}
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <div className="mb-6 space-y-4">
        <div className="pt-4 pb-2">
          <p className="text-[15px] font-normal mb-2">
            Logo image <span className="text-red-500">*</span>
          </p>
          <p className="text-[13px] mb-4">
            This image will also be used for navigation. 350 x 350 recommended.(Max: 10MB)
          </p>

          <div
            className={cn(
              'border-[3px] border-dashed rounded-full p-1 w-fit cursor-pointer',
              isDark ? 'border-white/20' : 'border-gray-300'
            )}
          >
            <input
              ref={fileRef1}
              className="hidden"
              accept=".png, .jpg, .gif"
              id="contained-button-file1"
              type="file"
              onChange={handleFileSelect1}
            />
            <div
              className={cn(
                'relative flex items-center justify-center w-[140px] h-[140px] rounded-full overflow-hidden cursor-pointer border',
                isDark ? 'border-white/10' : 'border-black/10'
              )}
            >
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black opacity-0 hover:opacity-60 transition-opacity z-10"
                onClick={() => fileRef1.current.click()}
              >
                <button
                  onClick={(e) => handleResetFile1(e)}
                  className={cn('absolute right-2 top-2', fileUrl1 ? 'block' : 'hidden')}
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
              {fileUrl1 ? (
                <img src={fileUrl1} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={64} className={isDark ? 'text-white/20' : 'text-gray-300'} />
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

          <div
            className={cn(
              'border-[3px] border-dashed rounded-xl p-1 w-fit cursor-pointer',
              isDark ? 'border-white/20' : 'border-gray-300'
            )}
          >
            <input
              ref={fileRef2}
              className="hidden"
              accept=".png, .jpg, .gif"
              id="contained-button-file2"
              type="file"
              onChange={handleFileSelect2}
            />
            <div
              className={cn(
                'relative flex items-center justify-center w-[320px] h-[240px] rounded-lg overflow-hidden cursor-pointer border',
                isDark ? 'border-white/10' : 'border-black/10'
              )}
            >
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black opacity-0 hover:opacity-60 transition-opacity z-10"
                onClick={() => fileRef2.current.click()}
              >
                <button
                  onClick={(e) => handleResetFile2(e)}
                  className={cn('absolute right-2 top-2', fileUrl2 ? 'block' : 'hidden')}
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
              {fileUrl2 ? (
                <img src={fileUrl2} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={100} className={isDark ? 'text-white/20' : 'text-gray-300'} />
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

          <div
            className={cn(
              'border-[3px] border-dashed rounded-xl p-1 cursor-pointer',
              isDark ? 'border-white/20' : 'border-gray-300'
            )}
          >
            <input
              ref={fileRef3}
              className="hidden"
              accept=".png, .jpg, .gif"
              id="contained-button-file3"
              type="file"
              onChange={handleFileSelect3}
            />
            <div
              className={cn(
                'relative flex items-center justify-center h-[200px] rounded-lg overflow-hidden cursor-pointer border',
                isDark ? 'border-white/10' : 'border-black/10'
              )}
            >
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black opacity-0 hover:opacity-60 transition-opacity z-10"
                onClick={() => fileRef3.current.click()}
              >
                <button
                  onClick={(e) => handleResetFile3(e)}
                  className={cn('absolute right-2 top-2', fileUrl3 ? 'block' : 'hidden')}
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
              {fileUrl3 ? (
                <img src={fileUrl3} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={100} className={isDark ? 'text-white/20' : 'text-gray-300'} />
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
            'w-full rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal outline-none',
            isDark
              ? 'border-white/15 bg-transparent text-white'
              : 'border-gray-300 bg-white text-gray-900'
          )}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.title} value={cat.title}>
              {cat.title}
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
            <span className="text-red-500 font-medium">Normal:</span> Imported collections will have Normal
            type.
          </p>
        </div>

        <div className="flex gap-2">
          {[
            { value: 'normal', disabled: false },
            { value: 'bulk', disabled: true },
            { value: 'random', disabled: true },
            { value: 'sequence', disabled: true }
          ].map((t) => (
            <button
              key={t.value}
              disabled={t.disabled}
              onClick={() => handleChangeType(t.value)}
              className={cn(
                'rounded-lg border-[1.5px] px-4 py-1 text-[13px] font-normal capitalize transition-colors',
                t.disabled && 'cursor-not-allowed opacity-40',
                type === t.value
                  ? 'border-[#137DFE] bg-[#137DFE]/10 text-[#137DFE]'
                  : isDark
                    ? 'border-white/15 text-white hover:border-[#137DFE]'
                    : 'border-gray-300 text-gray-900 hover:border-[#137DFE]'
              )}
            >
              {t.value}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <p className="text-[15px] font-normal">Description</p>
        <p className="text-[13px]">
          <a
            href="https://www.markdownguide.org/cheat-sheet/"
            className="text-[#137DFE] hover:underline"
          >
            Markdown
          </a>{' '}
          syntax is supported. 0 of 1000 characters used.
        </p>
        <textarea
          placeholder=""
          rows={4}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
          }}
          className={cn(
            'w-full rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal outline-none resize-none',
            isDark
              ? 'border-white/15 bg-transparent text-white placeholder:text-white/40'
              : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400'
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
            className="text-[#137DFE] hover:underline"
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

      {/* <div className="mb-6 space-y-4">
        <p className="text-[15px] font-normal">
          Private <span className="text-red-500">*</span>
        </p>
        <p className="text-[13px]">
          Make your collection private when you need to upload NFTs or do something private.
          You can make collection public again after you've done all things.
        </p>

        <div className="flex gap-2">
          {['no', 'yes'].map((p) => (
            <button
              key={p}
              onClick={() => handleChangePrivate(p)}
              className={cn(
                'rounded-lg border-[1.5px] px-4 py-1 text-[13px] font-normal capitalize transition-colors',
                privateCollection === p
                  ? 'border-[#137DFE] bg-[#137DFE]/10 text-[#137DFE]'
                  : isDark
                    ? 'border-white/15 text-white hover:border-[#137DFE]'
                    : 'border-gray-300 text-gray-900 hover:border-[#137DFE]'
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
          className="inline-block text-[#137DFE] hover:underline text-xs mt-3"
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
      </div> */}

      <div className="flex justify-end mt-10 mb-12">
        <LoadingButton
          disabled={!canImport}
          loading={loading}
          loadingPosition="start"
          startIcon={<Send size={18} />}
          onClick={onImportCollection}
        >
          Import
        </LoadingButton>
      </div>
    </>
  );
}
