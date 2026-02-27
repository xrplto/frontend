import React from 'react';
import api from 'src/utils/api';
import { useState, useEffect, useRef } from 'react';

// Context
import { useContext } from 'react';
import { ThemeContext, WalletContext, AppContext } from 'src/context/AppContext';

// Loader
import { ClipLoader } from 'src/components/Spinners';

// Icons
import { Image, Send, X, XCircle, Plus, Check, AlertCircle } from 'lucide-react';

// Utils
import { fNumber } from 'src/utils/formatters';
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
    <div className="relative">
      <div className="relative flex items-center">
        {startText && (
          <span
            className={cn(
              'absolute left-3 text-[13px]',
              'text-gray-600 dark:text-gray-400'
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
            'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 dark:border-white/15 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-gray-500',
            'focus:border-primary'
          )}
        />
        <div className="absolute right-3">
          {status === TEXT_CHECKING && <ClipLoader color="#ff0000" size={15} />}
          {status === TEXT_VALID && <Check size={18} className="text-green-500" />}
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
  className,
  ...props
}) => {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const isDisabled = disabled || loading;

  const getStartIcon = () => {
    if (loading && loadingPosition === 'start') {
      return <ClipLoader size={16} color="currentColor" />;
    }
    return startIcon;
  };

  const getEndIcon = () => {
    if (loading && loadingPosition === 'end') {
      return <ClipLoader size={16} color="currentColor" />;
    }
    return endIcon;
  };

  const getChildren = () => {
    if (loading && loadingPosition === 'center' && !startIcon && !endIcon) {
      return <ClipLoader size={16} color="currentColor" />;
    }
    return children;
  };

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={cn(
        'flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal transition-colors',
        'border-primary bg-primary text-white hover:bg-primary/90 dark:border-primary dark:bg-primary dark:text-white dark:hover:bg-primary/90',
        isDisabled && 'cursor-not-allowed opacity-50',
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

// Components
import AddCostDialog from './AddCostDialog';

function stringCompare(str1, str2) {
  if (!str1 && !str2) return false;
  if (str1 !== str2) return true;
  return false;
}

const FILE_UNCHANGED = 0;
const FILE_NEW = 1;
const FILE_REMOVED = 2;

export default function EditCollection({ collection }) {
  const BASE_URL = 'https://api.xrpl.to/v1';

  const logoImageUrl = collection.logoImage
    ? `https://s1.xrpl.to/nft-collection/${collection.logoImage}`
    : null;
  const featuredImageUrl = collection.featuredImage
    ? `https://s1.xrpl.to/nft-collection/${collection.featuredImage}`
    : null;
  const bannerImageUrl = collection.bannerImage
    ? `https://s1.xrpl.to/nft-collection/${collection.bannerImage}`
    : null;
  const spinnerImageUrl = collection.spinnerImage
    ? `https://s1.xrpl.to/nft-collection/${collection.spinnerImage}`
    : null;

  const fileRef1 = useRef();
  const fileRef2 = useRef();
  const fileRef3 = useRef();
  const fileRef4 = useRef();

  const { themeName } = useContext(ThemeContext);
  const { accountProfile } = useContext(WalletContext);
  const { openSnackbar } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const account = accountProfile?.account;
  const accountToken = accountProfile?.token;

  const [loading, setLoading] = useState(false);

  const [openAddCost, setOpenAddCost] = useState(false);

  // Normalize name/description: API may return object {collection_name, collection_description} or string
  const initialName =
    typeof collection.name === 'object' && collection.name !== null
      ? collection.name.collection_name || ''
      : collection.name || '';
  const initialDescription =
    typeof collection.description === 'object' && collection.description !== null
      ? collection.description.collection_description || ''
      : collection.description || '';

  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState(collection.category || 'NONE');
  const [slug, setSlug] = useState(collection.slug);
  const [description, setDescription] = useState(initialDescription);
  const [type, setType] = useState(collection.type);
  const [privateCollection, setPrivateCollection] = useState(collection.private);
  const [bulkUrl, setBulkUrl] = useState(collection.bulkUrl || '');
  const [costs, setCosts] = useState(collection.costs || []);
  const [taxon, setTaxon] = useState(collection.taxon);
  const [rarity, setRarity] = useState(collection.rarity || 'score');

  // Logo image
  const [fileUrl1, setFileUrl1] = useState(logoImageUrl);
  const [file1, setFile1] = useState(null);
  // Featured image
  const [fileUrl2, setFileUrl2] = useState(featuredImageUrl);
  const [file2, setFile2] = useState(null);
  // Banner image
  const [fileUrl3, setFileUrl3] = useState(bannerImageUrl);
  const [file3, setFile3] = useState(null);
  // Spinner GIF image
  const [fileUrl4, setFileUrl4] = useState(spinnerImageUrl);
  const [file4, setFile4] = useState(null);

  const [valid1, setValid1] = useState(false); // Name validation check
  const [valid2, setValid2] = useState(true); // Slug validation check

  const checkChanged = () => {
    if (file1) return true;

    if (file2) return true;
    else if (fileUrl2 !== featuredImageUrl) return true;

    if (file3) return true;
    else if (fileUrl3 !== bannerImageUrl) return true;

    if (file4) return true;
    else if (fileUrl4 !== spinnerImageUrl) return true;

    if (stringCompare(description, initialDescription)) return true;

    if (!slug) return false;
    if (slug !== collection.slug) return true;

    if (bulkUrl !== collection.bulkUrl) return true;

    if (privateCollection !== collection.private) return true;

    if (type !== 'normal') {
      if (JSON.stringify(costs) !== JSON.stringify(collection.costs || [])) {
        return true;
      } else {
      }
    }
    return false;
  };

  let canSaveChanges = (file1 || fileUrl1) && valid2 && checkChanged();

  if (type !== 'normal' && (!bulkUrl || costs.length < 1)) canSaveChanges = false;

  const getFileFlagArray = () => {
    let flag = [0, 0, 0, 0]; // 0: Not changed 1: New File 2: Removed
    if (file1) {
      flag[0] = FILE_NEW;
    }

    if (file2) {
      flag[1] = FILE_NEW;
    } else if (!fileUrl2) {
      flag[1] = FILE_REMOVED;
    }

    if (file3) {
      flag[2] = FILE_NEW;
    } else if (!fileUrl3) {
      flag[2] = FILE_REMOVED;
    }

    if (file4) {
      flag[3] = FILE_NEW;
    } else if (!fileUrl4) {
      flag[3] = FILE_REMOVED;
    }

    return flag;
  };

  const onEditCollection = async () => {
    if (!account || !accountToken) {
      openSnackbar('Please login', 'error');
      return;
    }
    setLoading(true);
    try {
      let res;

      const formdata = new FormData();

      let fileFlag = getFileFlagArray();

      if (fileFlag[0] === FILE_NEW) formdata.append('imgCollection', file1);
      if (fileFlag[1] === FILE_NEW) formdata.append('imgCollection', file2);
      if (fileFlag[2] === FILE_NEW) formdata.append('imgCollection', file3);
      if (fileFlag[3] === FILE_NEW) formdata.append('imgCollection', file4);

      const data = {};
      data.name = name;
      data.category = category;
      data.slug = slug;
      data.origSlug = collection.slug;
      data.description = description;
      data.fileFlag = fileFlag;
      data.type = type;
      data.rarity = rarity;
      data.private = privateCollection;
      if (type !== 'normal') {
        data.costs = costs;
        data.bulkUrl = bulkUrl;
      }
      data.uuid = collection.uuid;

      formdata.append('account', account);
      formdata.append('data', JSON.stringify(data));

      res = await api.post(`${BASE_URL}/nfts/edit`, formdata, {
        headers: { 'Content-Type': 'multipart/form-data', 'x-access-token': accountToken }
      });

      if (res.status === 200) {
        const ret = res.data;
        if (ret.status) {
          const data = ret.collection;
          openSnackbar('Edit collection successful!', 'success');
          window.location.href = `/congrats/editcollection/${data.slug}`;
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
          if (idx === 1) setFileUrl1(reader.result);
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
    openSnackbar('You can not change Type', 'error');
  };

  const handleChangePrivate = (newValue) => {
    setPrivateCollection(newValue);
  };

  const handleAddCost = (cost) => {
    let exist = false;
    const newCosts = [];
    for (var c of costs) {
      if (c.md5 === cost.md5) {
        c.amount = cost.amount;
        exist = true;
      }
      newCosts.push(c);
    }
    if (!exist) newCosts.push(cost);

    setCosts(newCosts);
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
      <div className="mt-8 mb-6 flex flex-col gap-2">
        <h1 className={cn('text-2xl font-normal', 'text-gray-900 dark:text-white')}>
          Edit My Collection
        </h1>
        <p className={cn('text-[13px] font-normal', 'text-gray-600 dark:text-gray-400')}>
          <span className="text-red-500">*</span> Required fields
        </p>

        {/* Logo Image */}
        <p
          className={cn(
            'pt-4 pb-2 text-[15px] font-normal',
            'text-gray-900 dark:text-white'
          )}
        >
          Logo image <span className="text-red-500">*</span>
        </p>
        <p className={cn('text-[13px] font-normal', 'text-gray-600 dark:text-gray-400')}>
          This image will also be used for navigation. 350 x 350 recommended.(Max: 10MB)
        </p>
        <div
          className={cn(
            'rounded-full border-[3px] border-dashed p-1 w-fit cursor-pointer',
            'border-gray-300 dark:border-white/20'
          )}
        >
          <input
            ref={fileRef1}
            className="hidden"
            accept=".png, .jpg, .gif"
            id="contained-button-file"
            type="file"
            onChange={handleFileSelect1}
          />
          <div
            className={cn(
              'relative flex items-center justify-center w-[140px] h-[140px] rounded-full overflow-hidden',
              'bg-gray-50 dark:bg-white/[0.02]'
            )}
          >
            <div
              onClick={() => fileRef1.current.click()}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black opacity-0 hover:opacity-60 transition-opacity cursor-pointer z-10"
            >
              {fileUrl1 && (
                <button onClick={(e) => handleResetFile1(e)} className="absolute top-2 right-2">
                  <X size={20} className="text-white" />
                </button>
              )}
            </div>
            {fileUrl1 ? (
              <img src={fileUrl1} alt="" className="w-full h-full object-cover" />
            ) : (
              <Image size={64} className={'text-gray-400 dark:text-gray-600'} />
            )}
          </div>
        </div>

        {/* Featured Image */}
        <p
          className={cn(
            'pt-4 pb-2 text-[15px] font-normal',
            'text-gray-900 dark:text-white'
          )}
        >
          Featured image
        </p>
        <p className={cn('text-[13px] font-normal', 'text-gray-600 dark:text-gray-400')}>
          This image will be used for featuring your collection on the homepage, category pages, or
          other promotional areas of XRPNFT.COM. 600 x 400 recommended.(Max: 10MB)
        </p>
        <div
          className={cn(
            'rounded-xl border-[3px] border-dashed p-1 w-fit cursor-pointer',
            'border-gray-300 dark:border-white/20'
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
              'relative flex items-center justify-center w-[320px] h-[240px] rounded-xl overflow-hidden',
              'bg-gray-50 dark:bg-white/[0.02]'
            )}
          >
            <div
              onClick={() => fileRef2.current.click()}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black opacity-0 hover:opacity-60 transition-opacity cursor-pointer z-10"
            >
              {fileUrl2 && (
                <button onClick={(e) => handleResetFile2(e)} className="absolute top-2 right-2">
                  <X size={20} className="text-white" />
                </button>
              )}
            </div>
            {fileUrl2 ? (
              <img src={fileUrl2} alt="" className="w-full h-full object-cover" />
            ) : (
              <Image size={100} className={'text-gray-400 dark:text-gray-600'} />
            )}
          </div>
        </div>

        {/* Banner Image */}
        <p
          className={cn(
            'pt-4 pb-2 text-[15px] font-normal',
            'text-gray-900 dark:text-white'
          )}
        >
          Banner image
        </p>
        <p className={cn('text-[13px] font-normal', 'text-gray-600 dark:text-gray-400')}>
          This image will appear at the top of your collection page. Avoid including too much text
          in this banner image, as the dimensions change on different devices. 1400 x 350
          recommended.(Max: 10MB)
        </p>
        <div
          className={cn(
            'rounded-xl border-[3px] border-dashed p-1 cursor-pointer',
            'border-gray-300 dark:border-white/20'
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
              'relative flex items-center justify-center h-[200px] rounded-xl overflow-hidden',
              'bg-gray-50 dark:bg-white/[0.02]'
            )}
          >
            <div
              onClick={() => fileRef3.current.click()}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black opacity-0 hover:opacity-60 transition-opacity cursor-pointer z-10"
            >
              {fileUrl3 && (
                <button onClick={(e) => handleResetFile3(e)} className="absolute top-2 right-2">
                  <X size={20} className="text-white" />
                </button>
              )}
            </div>
            {fileUrl3 ? (
              <img src={fileUrl3} alt="" className="w-full h-full object-cover" />
            ) : (
              <Image size={100} className={'text-gray-400 dark:text-gray-600'} />
            )}
          </div>
        </div>

        {/* Name */}
        <p
          className={cn(
            'pt-4 pb-2 text-[15px] font-normal',
            'text-gray-900 dark:text-white'
          )}
        >
          Name <span className="text-red-500">*</span>
        </p>

        <LoadingTextField
          id="id_collection_name"
          placeholder="Example: My XRPL NFTs"
          type="EDIT_COLLECTION_NAME"
          uuid={collection.uuid}
          startText=""
          value={name}
          setValid={setValid1}
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-4 mb-6">
        <p className={cn('text-[15px] font-normal', 'text-gray-900 dark:text-white')}>
          Category
        </p>
        <p className={cn('text-[13px] font-normal', 'text-gray-600 dark:text-gray-400')}>
          This helps your NFT to be found when people search by Category.
        </p>
        <select
          disabled
          id="select_category"
          value={category}
          onChange={(e) => handleChangeCategory(e.target.value)}
          className={cn(
            'rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal outline-none cursor-not-allowed opacity-50',
            'border-gray-300 bg-gray-50 text-gray-900 dark:border-white/15 dark:bg-white/[0.02] dark:text-white'
          )}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.title} value={cat.title}>
              {cat.icon} {cat.title}
            </option>
          ))}
        </select>
      </div>

      {/* URL */}
      <div className="flex flex-col gap-4 mb-6">
        <p className={cn('text-[15px] font-normal', 'text-gray-900 dark:text-white')}>
          URL
        </p>
        <p className={cn('text-[13px] font-normal', 'text-gray-600 dark:text-gray-400')}>
          Customize your URL on XRPNFT.COM. Must only contain lowercase letters, numbers, and
          hyphens.
        </p>
        <LoadingTextField
          id="id_collection_slug"
          placeholder="my-xrpl-nfts"
          type="EDIT_COLLECTION_SLUG"
          uuid={collection.uuid}
          startText="https://xrpl.to/nfts/"
          value={slug}
          setValid={setValid2}
          onChange={(e) => {
            const value = e.target.value;
            const newSlug = value ? value.replace(/[^a-z0-9-]/g, '') : '';
            setSlug(newSlug);
          }}
        />
      </div>

      {/* Type */}
      <div className="flex flex-col gap-4 mb-6">
        <p className={cn('text-[15px] font-normal', 'text-gray-900 dark:text-white')}>
          Type <span className="text-red-500">*</span>
        </p>
        <p className={cn('text-[13px] font-normal', 'text-gray-600 dark:text-gray-400')}>
          Select your collection type.
        </p>

        <div className="pl-0 flex flex-col gap-2">
          <p className={cn('text-[13px]', 'text-gray-600 dark:text-gray-400')}>
            <span className="text-red-500">Normal:</span> You can mint NFTs one by one for this
            collection.
          </p>
          <p className={cn('text-[13px]', 'text-gray-600 dark:text-gray-400')}>
            <span className="text-red-500">Normal Bulk:</span> You can upload bulk NFTs and sell
            NFTs nomally with Mints.
          </p>
          <p className={cn('text-[13px]', 'text-gray-600 dark:text-gray-400')}>
            <span className="text-red-500">Random Bulk:</span> You can upload bulk NFTs and sell
            NFTs randomly with Mints.
          </p>
          <p className={cn('text-[13px]', 'text-gray-600 dark:text-gray-400')}>
            <span className="text-red-500">Sequence Bulk:</span> You can upload bulk NFTs and sell
            NFTs sequently with Mints.
          </p>
        </div>

        <div className="flex gap-2">
          {['normal', 'bulk', 'random', 'sequence'].map((t) => (
            <button
              key={t}
              onClick={() => handleChangeType(t)}
              className={cn(
                'rounded-lg border-[1.5px] px-4 py-1.5 text-[13px] font-normal capitalize transition-colors',
                type === t
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-300 text-gray-600 hover:border-primary dark:border-white/15 dark:text-gray-400 dark:hover:border-primary'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {type !== 'normal' && (
          <>
            <div className="flex flex-col gap-2">
              {type === 'bulk' ? (
                <p
                  className={cn('text-[14px] font-normal', 'text-gray-900 dark:text-white')}
                >
                  Costs per NFT <span className="text-red-500">*</span>
                </p>
              ) : (
                <p
                  className={cn('text-[14px] font-normal', 'text-gray-900 dark:text-white')}
                >
                  Costs per Mint <span className="text-red-500">*</span>
                </p>
              )}
              <p className={cn('text-[13px] pb-4', 'text-gray-600 dark:text-gray-400')}>
                You need to add at least 1 currency to create a collection.
              </p>

              {costs.map((cost, idx) => (
                <div key={cost.md5} className="flex flex-col gap-2 px-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        alt="C"
                        src={`https://s1.xrpl.to/token/${cost.md5}`}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-4">
                          <span
                            className={cn(
                              'text-[15px] font-normal',
                              'text-gray-900 dark:text-white'
                            )}
                          >
                            {cost.name}
                          </span>
                          <span
                            className={cn(
                              'text-[15px] font-normal',
                              'text-gray-900 dark:text-white'
                            )}
                          >
                            ✕ {fNumber(cost.exch)}
                          </span>
                        </div>
                        <p
                          className={cn('text-[13px]', 'text-gray-600 dark:text-gray-400')}
                        >
                          {cost.issuer}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-end gap-2">
                        <span className="text-[15px] text-red-500">{cost.amount}</span>
                        <span className="text-[11px] text-red-500">{cost.name}</span>
                      </div>

                      <button onClick={() => handleRemoveCost(cost.md5)}>
                        <XCircle size={20} className={'text-gray-600 dark:text-gray-400'} />
                      </button>
                    </div>
                  </div>
                  <div className={cn('h-px', 'bg-gray-200 dark:bg-white/10')} />
                </div>
              ))}

              <div className="flex pt-2 pb-6 pl-2">
                <button
                  onClick={() => setOpenAddCost(true)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border-[1.5px] px-3 py-1.5 text-[13px] font-normal transition-colors',
                    'border-gray-300 text-gray-900 hover:border-primary dark:border-white/15 dark:text-white dark:hover:border-primary'
                  )}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 pl-0">
              <p className={cn('text-[14px] font-normal', 'text-gray-900 dark:text-white')}>
                Paste the Google Drive file shared link URL here.{' '}
                <span className="text-red-500">*</span>
              </p>
              <p className={cn('text-[13px]', 'text-gray-600 dark:text-gray-400')}>
                Upload .zip file contains your NFT images to Google Drive and copy & paste the
                shared link URL.
              </p>

              <input
                id="id_bulk_url"
                disabled
                placeholder="https://drive.google.com/file/d/1xjA-1bodiMrvSCtdTEMis5y2Cab74bXU/view"
                value={bulkUrl}
                className={cn(
                  'rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal outline-none cursor-not-allowed opacity-50',
                  'border-gray-300 bg-gray-50 text-gray-900 dark:border-white/15 dark:bg-white/[0.02] dark:text-white'
                )}
              />
            </div>

            {(type === 'random' || type === 'sequence') && (
              <>
                <p
                  className={cn(
                    'pt-4 pb-2 text-[15px] font-normal',
                    'text-gray-900 dark:text-white'
                  )}
                >
                  Spinner GIF image
                </p>
                <p
                  className={cn(
                    'text-[13px] font-normal',
                    'text-gray-600 dark:text-gray-400'
                  )}
                >
                  This image will be used for spinning NFTs. If you don't select, the{' '}
                  <a
                    target="_blank"
                    href={`/static/spin.gif`}
                    rel="noreferrer noopener nofollow"
                    className="text-primary underline"
                  >
                    default spinning image
                  </a>{' '}
                  will be used. 600 x 400 recommended. (Max: 10MB)
                </p>
                <div
                  className={cn(
                    'rounded-xl border-[3px] border-dashed p-1 w-fit cursor-pointer',
                    'border-gray-300 dark:border-white/20'
                  )}
                >
                  <input
                    ref={fileRef4}
                    className="hidden"
                    accept=".png, .jpg, .gif"
                    id="contained-button-file4"
                    type="file"
                    onChange={handleFileSelect4}
                  />
                  <div
                    className={cn(
                      'relative flex items-center justify-center w-[320px] h-[240px] rounded-xl overflow-hidden',
                      'bg-gray-50 dark:bg-white/[0.02]'
                    )}
                  >
                    <div
                      onClick={() => fileRef4.current.click()}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black opacity-0 hover:opacity-60 transition-opacity cursor-pointer z-10"
                    >
                      {fileUrl4 && (
                        <button
                          onClick={(e) => handleResetFile4(e)}
                          className="absolute top-2 right-2"
                        >
                          <X size={20} className="text-white" />
                        </button>
                      )}
                    </div>
                    {fileUrl4 ? (
                      <img src={fileUrl4} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Image size={100} className={'text-gray-400 dark:text-gray-600'} />
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-4 mb-6">
        <p className={cn('text-[15px] font-normal', 'text-gray-900 dark:text-white')}>
          Description
        </p>
        <p className={cn('text-[13px]', 'text-gray-600 dark:text-gray-400')}>
          <a href="https://www.markdownguide.org/cheat-sheet/" className="text-primary underline">
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
            'rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal outline-none resize-none transition-colors',
            'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 dark:border-white/15 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-gray-500',
            'focus:border-primary'
          )}
        />
      </div>

      {/* Taxon */}
      <div className="flex flex-col gap-4 mb-6">
        <p className={cn('text-[15px] font-normal', 'text-gray-900 dark:text-white')}>
          Taxon
        </p>
        <p className={cn('text-[13px]', 'text-gray-600 dark:text-gray-400')}>
          Taxon links NFTs to this collection, NFTs minted for this collection will have this Taxon
          in their NFTokenID field. Taxon is automatically set.
        </p>

        <input
          id="id_collection_taxon"
          disabled
          placeholder=""
          value={taxon}
          className={cn(
            'rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal outline-none cursor-not-allowed opacity-50',
            'border-gray-300 bg-gray-50 text-gray-900 dark:border-white/15 dark:bg-white/[0.02] dark:text-white'
          )}
        />
      </div>

      {/* Rarity */}
      <div className="flex flex-col gap-4 mb-6">
        <p className={cn('text-[15px] font-normal', 'text-gray-900 dark:text-white')}>
          Rarity <span className="text-red-500">*</span>
        </p>
        <p className={cn('text-[13px]', 'text-gray-600 dark:text-gray-400')}>
          Select your collection's rarity calculation method.{' '}
          <a
            target="_blank"
            href={`https://raritytools.medium.com/ranking-rarity-understanding-rarity-calculation-methods-86ceaeb9b98c`}
            rel="noreferrer noopener nofollow"
            className="text-primary underline"
          >
            Read More
          </a>
        </p>

        <div className="pl-0 flex flex-col gap-2">
          <p className={cn('text-[13px]', 'text-gray-600 dark:text-gray-400')}>
            <span className="text-red-500">Standard:</span> Simply compare the rarest trait of each
            NFT(%).
          </p>
          <p className={cn('text-[13px]', 'text-gray-600 dark:text-gray-400')}>
            <span className="text-red-500">Average:</span> Average the rarity of traits that exist
            on the NFT(%).
          </p>
          <p className={cn('text-[13px]', 'text-gray-600 dark:text-gray-400')}>
            <span className="text-red-500">Statistical:</span> Multiply all of its trait rarities
            together(%).
          </p>
          <p className={cn('text-[13px]', 'text-gray-600 dark:text-gray-400')}>
            <span className="text-red-500">Score:</span> Sum of the Rarity Score of all of its trait
            values(not %, just a value).
          </p>
          <p className={cn('text-[13px]', 'text-gray-600 dark:text-gray-400')}>
            <span className="text-red-500">Self:</span> Rarity and Rank are included in each NFT
            metadata.
          </p>
        </div>

        <div className="ml-10 flex flex-col gap-3">
          {['standard', 'average', 'statistical', 'score', 'self'].map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rarity"
                value={r}
                checked={rarity === r}
                onChange={(e) => handleChangeRarity(e.target.value)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
              <span
                className={cn(
                  'text-[13px] font-normal capitalize',
                  'text-gray-900 dark:text-white'
                )}
              >
                {r}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Private */}
      <div className="flex flex-col gap-4 mb-6">
        <p className={cn('text-[15px] font-normal', 'text-gray-900 dark:text-white')}>
          Private <span className="text-red-500">*</span>
        </p>
        <p className={cn('text-[13px]', 'text-gray-600 dark:text-gray-400')}>
          Make your collection private when you need to upload NFTs or do something private. You can
          make collection public again after you've done all things.
        </p>

        <div className="flex gap-2">
          {['no', 'yes'].map((p) => (
            <button
              key={p}
              onClick={() => handleChangePrivate(p)}
              className={cn(
                'rounded-lg border-[1.5px] px-4 py-1 text-[13px] font-normal capitalize transition-colors',
                privateCollection === p
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-300 text-gray-600 hover:border-primary dark:border-white/15 dark:text-gray-400 dark:hover:border-primary'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-start items-center mt-10 mb-12">
        <LoadingButton
          disabled={!canSaveChanges}
          loading={loading}
          loadingPosition="start"
          startIcon={<Send size={16} />}
          onClick={onEditCollection}
        >
          Save Changes
        </LoadingButton>
      </div>
    </>
  );
}
