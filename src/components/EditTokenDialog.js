import api, { apiFetch } from 'src/utils/api';
import { useRef, useState, useContext } from 'react';
import { Check, X, PlusCircle, Edit, Info, Download } from 'lucide-react';
import { cn } from 'src/utils/cn';

// Loader
import { PulseLoader } from './Spinners';

// Context
import { ThemeContext, WalletContext, AppContext } from 'src/context/AppContext';

// Redux
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

// Inline EditDialog component
const EditDialog = ({ label, value, setValue }) => {
  const [val, setVal] = useState(value ? value : '');
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setVal(value);
    setOpen(false);
  };

  const handleOK = () => {
    setValue(val);
    setOpen(false);
  };

  const onChangeValue = (event) => {
    setVal(event.target.value);
  };

  return (
    <div>
      <button
        onClick={handleClickOpen}
        aria-label="Edit token"
        className={cn(
          'rounded-lg border-[1.5px] p-1.5 text-[13px] font-normal outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
          'border-gray-300 hover:bg-gray-100 dark:border-white/15 dark:hover:border-primary dark:hover:bg-primary/5'
        )}
      >
        <Edit size={14} />
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Edit token" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm max-sm:h-dvh">
          <div
            className={cn(
              'rounded-2xl border p-6 w-[400px] max-w-[90vw]',
              'bg-white/98 backdrop-blur-2xl border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:bg-black/90 dark:backdrop-blur-2xl dark:border-[#3f96fe]/10 dark:shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
            )}
          >
            <div className="mb-4">
              <label className="block text-[11px] font-medium uppercase tracking-wide mb-2 text-gray-500">
                {label}
              </label>
              <input
                value={val}
                onChange={onChangeValue}
                autoFocus
                className={cn(
                  'w-full rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal outline-none',
                  'bg-white border-gray-300 text-gray-900 focus:border-primary dark:bg-white/5 dark:border-white/15 dark:text-white dark:focus:border-primary'
                )}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleClose}
                className={cn(
                  'rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal',
                  'border-gray-300 hover:bg-gray-100 dark:border-white/15 dark:hover:bg-white/5'
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleOK}
                className={cn(
                  'rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal',
                  'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                )}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function EditTokenDialog({ token, setToken }) {
  const fileRef = useRef();

  const BASE_URL = 'https://api.xrpl.to';
  const { themeName } = useContext(ThemeContext);
  const { accountProfile, setOpenWalletModal } = useContext(WalletContext);
  const { openSnackbar } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [loading, setLoading] = useState(false);

  const { issuer, name, currency, md5, dateon } = token;

  const imgUrl = `https://s1.xrpl.to/token/${md5}`;

  const [file, setFile] = useState(null);
  const [kyc, setKYC] = useState(token.kyc);
  const [ext, setExt] = useState(token.ext || '');
  const [imgData, setImgData] = useState(imgUrl);
  const [user, setUser] = useState(token.user);
  const [domain, setDomain] = useState(token.domain);
  const [date, setDate] = useState(token.date);
  const [slug, setSlug] = useState(token.slug);
  const [whitepaper, setWhitepaper] = useState(token.whitepaper);
  const [twitter, setTwitter] = useState(token.social?.twitter);
  const [facebook, setFacebook] = useState(token.social?.facebook);
  const [linkedin, setLinkedin] = useState(token.social?.linkedin);
  const [instagram, setInstagram] = useState(token.social?.instagram);
  const [telegram, setTelegram] = useState(token.social?.telegram);
  const [discord, setDiscord] = useState(token.social?.discord);
  const [youtube, setYoutube] = useState(token.social?.youtube);
  const [medium, setMedium] = useState(token.social?.medium);
  const [twitch, setTwitch] = useState(token.social?.twitch);
  const [tiktok, setTiktok] = useState(token.social?.tiktok);
  const [reddit, setReddit] = useState(token.social?.reddit);
  const [tags, setTags] = useState(token.tags);

  // AddDialog inline state
  const [addTagVal, setAddTagVal] = useState('');
  const [addTagOpen, setAddTagOpen] = useState(false);

  const handleDeleteTags = (tagToDelete) => () => {
    setTags((tags) => tags.filter((tag) => tag !== tagToDelete));
  };

  const onAddTag = (val) => {
    let newTags = [];
    const found = tags ? tags.find((t) => t === val) : undefined;
    if (found) {
      return;
    }
    if (tags) {
      newTags.push(...tags);
      newTags.push(val);
      setTags(newTags);
    } else {
      setTags([val]);
    }
  };

  const handleAddTagClickOpen = () => {
    setAddTagOpen(true);
  };

  const handleAddTagClose = () => {
    setAddTagVal('');
    setAddTagOpen(false);
  };

  const handleAddTagOK = () => {
    setAddTagOpen(false);
    onAddTag(addTagVal);
    setAddTagVal('');
  };

  const onChangeAddTagValue = (event) => {
    setAddTagVal(event.target.value);
  };

  const onUpdateToken = async (data) => {
    let finish = false;
    setLoading(true);
    try {
      let res;

      const accountAdmin = accountProfile.account;
      const accountToken = accountProfile.token;

      if (!accountAdmin || !accountToken) {
        openSnackbar('Authentication required. Please connect your wallet.', 'error');
        setLoading(false);
        return;
      }

      const tokenAge = accountProfile.tokenCreatedAt
        ? Date.now() - accountProfile.tokenCreatedAt
        : null;
      if (!tokenAge || tokenAge > 23 * 60 * 60 * 1000) {
        openSnackbar('Your session has expired. Please reconnect your wallet.', 'info');
        setLoading(false);
        if (
          window.confirm(
            'Your authentication has expired. Would you like to reconnect your wallet?'
          )
        ) {
          setOpenWalletModal(true);
        }
        return;
      }

      const formdata = new FormData();
      formdata.append('avatar', file);
      formdata.append('account', accountAdmin);
      formdata.append('data', JSON.stringify(data));

      if (!accountToken) {
        console.error('No auth token available!');
        openSnackbar('No authentication token. Please log in again.', 'error');
        setLoading(false);
        return;
      }

      res = await apiFetch(`${BASE_URL}/admin/update-token`, {
        method: 'POST',
        headers: {
          'x-access-account': accountAdmin,
          'x-access-token': accountToken
        },
        body: formdata
      });

      const responseData = await res.json();

      res = {
        status: res.status,
        data: responseData
      };

      if (res.status === 200) {
        const ret = res.data;
        if (ret.status) {
          Object.assign(token, data);
          token.time = Date.now();
          setFile(null);
          openSnackbar('Successfully changed the token info', 'success');
          finish = true;
        } else {
          const err = ret.err;
          if (err === 'ERR_TRANSFER') openSnackbar('Upload image error, please try again', 'error');
          else if (err === 'ERR_GENERAL') openSnackbar('Invalid data, please check again', 'error');
          else if (err === 'ERR_URL_SLUG') openSnackbar('Duplicated URL Slug', 'error');
          else openSnackbar('Internal error occured', 'error');
        }
      }
    } catch (err) {
      console.error('EditTokenDialog Error:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);

        if (err.response.status === 401) {
          openSnackbar(
            'Authentication failed. Please ensure you are logged in with an admin account.',
            'error'
          );
        } else {
          openSnackbar(`Server error: ${err.response.status}`, 'error');
        }
      } else if (err.request) {
        openSnackbar('Network error. Please check your connection.', 'error');
      } else {
        openSnackbar('An unexpected error occurred.', 'error');
      }
    }
    setLoading(false);
    if (finish) setToken(null);
  };

  const handleSave = () => {
    const check = slug ? slug.replace(/[^a-zA-Z0-9-]/g, '') : null;
    if (!check || check !== slug) {
      openSnackbar('Invalid URL Slug, only alphabetic(A-Z, a-z, 0-9, -) allowed', 'error');
      return;
    }

    const newToken = {};
    newToken.md5 = md5;
    newToken.domain = domain;
    newToken.user = user;
    newToken.kyc = kyc;
    newToken.ext = ext;
    newToken.date = date;

    if (slug) newToken.slug = slug;
    else newToken.slug = md5;

    newToken.whitepaper = whitepaper;
    if (tags) newToken.tags = tags;

    const social = {};
    if (twitter) social.twitter = twitter;
    if (facebook) social.facebook = facebook;
    if (linkedin) social.linkedin = linkedin;
    if (instagram) social.instagram = instagram;
    if (telegram) social.telegram = telegram;
    if (discord) social.discord = discord;
    if (youtube) social.youtube = youtube;
    if (medium) social.medium = medium;
    if (twitch) social.twitch = twitch;
    if (tiktok) social.tiktok = tiktok;
    if (reddit) social.reddit = reddit;

    newToken.social = social;

    onUpdateToken(newToken);
  };

  const handleClose = () => {
    setToken(null);
  };

  const handleFileSelect = (e) => {
    const pickedFile = e.target.files[0];
    if (pickedFile) {
      const fileName = pickedFile.name;
      var re = /(?:\.([^.]+))?$/;
      var newExt = re.exec(fileName)[1];
      if (newExt) newExt = newExt.toLowerCase();

      if (newExt === 'jpg' || newExt === 'png') {
        setExt(newExt);
        setFile(pickedFile);
        const reader = new FileReader();
        reader.readAsDataURL(pickedFile);
        reader.onloadend = function (e) {
          setImgData(reader.result);
        };
      }
    }
  };

  const handleGetDate = () => {
    setLoading(true);
    api
      .get(`https://api.xrplorer.com/custom/getTokenBirth?issuer=${issuer}&currency=${currency}`)
      .then((res) => {
        let ret = res.status === 200 ? res.data : undefined;
        if (ret && ret.date) {
          let date_fixed = '';
          try {
            date_fixed = ret.date.split('T')[0];
          } catch (e) {}
          setDate(date_fixed);
        }
      })
      .catch((err) => {
        openSnackbar('Date is still unknown, you can manually edit it', 'error');
      })
      .then(function () {
        setLoading(false);
      });
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm max-sm:h-dvh">
          <PulseLoader color={'#FF4842'} size={10} />
        </div>
      )}

      <div role="dialog" aria-modal="true" aria-label="Edit token" className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto max-sm:h-dvh">
        <div
          className={cn(
            'rounded-2xl border w-full max-w-4xl my-8',
            'bg-white/98 backdrop-blur-2xl border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:bg-black/90 dark:backdrop-blur-2xl dark:border-[#3f96fe]/10 dark:shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                style={{ display: 'none' }}
                accept=".png, .jpg"
                id="contained-button-file"
                multiple={false}
                type="file"
                onChange={handleFileSelect}
              />
              <img
                alt={name}
                src={imgData}
                className="w-14 h-14 rounded-lg cursor-pointer hover:opacity-60 transition-opacity"
                onClick={() => fileRef.current.click()}
              />
              <h2 className="text-[15px] font-normal text-primary">{name}</h2>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className={cn(
                  'rounded-lg border-[1.5px] p-2 text-[13px] font-normal',
                  'border-green-500/50 text-green-500 hover:bg-green-500/10'
                )}
                title="Save"
              >
                <Check size={16} />
              </button>
              <button
                onClick={handleClose}
                aria-label="Close"
                className={cn(
                  'rounded-lg border-[1.5px] p-2 text-[13px] font-normal outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
                  'border-red-500/50 text-red-500 hover:bg-red-500/10'
                )}
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Main Info Table */}
          <div className="p-4">
            <table className="w-full">
              <tbody>
                <tr className={'border-b border-gray-100 dark:border-b dark:border-white/5'}>
                  <td className="py-2 pr-4 text-right w-[15%] text-[13px] text-gray-500">Issuer</td>
                  <td className="py-2 text-[13px] text-gray-500">{issuer}</td>
                </tr>
                <tr className={'border-b border-gray-100 dark:border-b dark:border-white/5'}>
                  <td className="py-2 pr-4 text-right text-[13px] text-gray-500">Currency</td>
                  <td className="py-2 text-[13px]">
                    <span className="text-gray-500">{name}</span>
                    <span className="text-gray-400 text-[11px] ml-2">({currency})</span>
                  </td>
                </tr>
                <tr className={'border-b border-gray-100 dark:border-b dark:border-white/5'}>
                  <td className="py-2 pr-4 text-right text-[13px] text-gray-500">MD5</td>
                  <td className="py-2 text-[13px] text-gray-500">
                    {md5} <span className="ml-2">{ext.toUpperCase()}</span>
                  </td>
                </tr>
                <tr className={'border-b border-gray-100 dark:border-b dark:border-white/5'}>
                  <td className="py-2 pr-4 text-right text-[13px] text-gray-500">Domain</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://${domain}`}
                        target="_blank"
                        rel="noreferrer noopener nofollow"
                        className="text-[13px] text-primary hover:underline"
                      >
                        {domain}
                      </a>
                      <EditDialog
                        label="Domain"
                        value={domain}
                        setValue={setDomain}
                      />
                    </div>
                  </td>
                </tr>
                <tr className={'border-b border-gray-100 dark:border-b dark:border-white/5'}>
                  <td className="py-2 pr-4 text-right text-[13px] text-gray-500">User</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-primary">{user}</span>
                      <EditDialog label="User" value={user} setValue={setUser} />
                      <button
                        onClick={() => setKYC(!kyc)}
                        className={cn(
                          'rounded-lg border-[1.5px] px-2 py-1 text-[11px] font-medium uppercase tracking-wide',
                          kyc
                            ? 'border-green-500/50 text-green-500 bg-green-500/10'
                            : 'border-gray-500/50 text-gray-500 bg-gray-500/10'
                        )}
                        title="Click to toggle"
                      >
                        KYC
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className={'border-b border-gray-100 dark:border-b dark:border-white/5'}>
                  <td className="py-2 pr-4 text-right text-[13px] text-gray-500">Created Date</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-primary">{date}</span>
                      <button
                        onClick={handleGetDate}
                        className={cn(
                          'rounded-lg border-[1.5px] p-1.5 text-[13px] font-normal',
                          'border-gray-300 hover:bg-gray-100 dark:border-white/15 dark:hover:border-primary dark:hover:bg-primary/5'
                        )}
                        title="Get date from online"
                      >
                        <Download size={14} />
                      </button>
                      <EditDialog label="Date" value={date} setValue={setDate} />
                      <span className="text-[11px] text-gray-400">
                        {new Date(dateon).toISOString().split('.')[0].replace('T', ' ')}
                      </span>
                      <Info
                        size={14}
                        className="text-gray-400"
                        title="Token discovered date by the Ledger Scanner."
                      />
                    </div>
                  </td>
                </tr>
                <tr className={'border-b border-gray-100 dark:border-b dark:border-white/5'}>
                  <td className="py-2 pr-4 text-right text-[13px] text-gray-500">URL Slug</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`token/${slug}`}
                        target="_blank"
                        rel="noreferrer noopener nofollow"
                        className="text-[13px] text-primary hover:underline"
                      >
                        {slug}
                      </a>
                      <EditDialog
                        label="URL Slug"
                        value={slug}
                        setValue={setSlug}
                      />
                    </div>
                  </td>
                </tr>
                <tr className={'border-b border-gray-100 dark:border-b dark:border-white/5'}>
                  <td className="py-2 pr-4 text-right text-[13px] text-gray-500">Whitepaper</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`${whitepaper}`}
                        target="_blank"
                        rel="noreferrer noopener nofollow"
                        className="text-[13px] text-primary hover:underline truncate max-w-md"
                      >
                        {whitepaper}
                      </a>
                      <EditDialog
                        label="Whitepaper URL"
                        value={whitepaper}
                        setValue={setWhitepaper}
                      />
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-white/[0.08]">
                  <td className="py-2 pr-4 text-right text-[13px] text-gray-500">Tags</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      {tags &&
                        tags.map((tag, idx) => (
                          <span
                            key={md5 + idx + tag}
                            className={cn(
                              'rounded-lg border-[1.5px] px-3 py-1 text-[11px] font-normal flex items-center gap-1',
                              'border-gray-300 bg-gray-50 dark:border-white/15 dark:bg-white/5'
                            )}
                          >
                            {tag}
                            <button
                              onClick={handleDeleteTags(tag)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      <button
                        onClick={handleAddTagClickOpen}
                        className={cn(
                          'rounded-lg border-[1.5px] p-1.5 text-[13px] font-normal',
                          'border-gray-300 hover:bg-gray-100 dark:border-white/15 dark:hover:border-primary dark:hover:bg-primary/5'
                        )}
                      >
                        <PlusCircle size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Social Links Table */}
          <div className="p-4">
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-2 pr-4 text-right w-[15%] text-[13px] text-gray-500">
                    Twitter
                  </td>
                  <td className="py-2 w-[35%]">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://twitter.com/${twitter}`}
                        target="_blank"
                        rel="noreferrer noopener nofollow"
                        className="text-[13px] text-primary hover:underline"
                      >
                        {twitter}
                      </a>
                      <EditDialog
                        label="Twitter"
                        value={twitter}
                        setValue={setTwitter}
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-right w-[15%] text-[13px] text-gray-500">
                    YouTube
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://www.youtube.com/${youtube}`}
                        target="_blank"
                        rel="noreferrer noopener nofollow"
                        className="text-[13px] text-primary hover:underline"
                      >
                        {youtube}
                      </a>
                      <EditDialog
                        label="YouTube"
                        value={youtube}
                        setValue={setYoutube}
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-right text-[13px] text-gray-500">Facebook</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://www.facebook.com/${facebook}/`}
                        target="_blank"
                        rel="noreferrer noopener nofollow"
                        className="text-[13px] text-primary hover:underline"
                      >
                        {facebook}
                      </a>
                      <EditDialog
                        label="Facebook"
                        value={facebook}
                        setValue={setFacebook}
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-right text-[13px] text-gray-500">Medium</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://medium.com/${medium}`}
                        target="_blank"
                        rel="noreferrer noopener nofollow"
                        className="text-[13px] text-primary hover:underline"
                      >
                        {medium}
                      </a>
                      <EditDialog
                        label="Medium"
                        value={medium}
                        setValue={setMedium}
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-right text-[13px] text-gray-500">LinkedIn</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://www.linkedin.com/company/${linkedin}/`}
                        target="_blank"
                        rel="noreferrer noopener nofollow"
                        className="text-[13px] text-primary hover:underline"
                      >
                        {linkedin}
                      </a>
                      <EditDialog
                        label="LinkedIn"
                        value={linkedin}
                        setValue={setLinkedin}
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-right text-[13px] text-gray-500">Twitch</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://twitch.tv/${twitch}`}
                        target="_blank"
                        rel="noreferrer noopener nofollow"
                        className="text-[13px] text-primary hover:underline"
                      >
                        {twitch}
                      </a>
                      <EditDialog
                        label="Twitch"
                        value={twitch}
                        setValue={setTwitch}
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-right text-[13px] text-gray-500">Instagram</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://www.instagram.com/${instagram}/`}
                        target="_blank"
                        rel="noreferrer noopener nofollow"
                        className="text-[13px] text-primary hover:underline"
                      >
                        {instagram}
                      </a>
                      <EditDialog
                        label="Instagram"
                        value={instagram}
                        setValue={setInstagram}
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-right text-[13px] text-gray-500">Tiktok</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://tiktok.com/${tiktok}`}
                        target="_blank"
                        rel="noreferrer noopener nofollow"
                        className="text-[13px] text-primary hover:underline"
                      >
                        {tiktok}
                      </a>
                      <EditDialog
                        label="Tiktok"
                        value={tiktok}
                        setValue={setTiktok}
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-right text-[13px] text-gray-500">Discord</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://discord.gg/${discord}`}
                        target="_blank"
                        rel="noreferrer noopener nofollow"
                        className="text-[13px] text-primary hover:underline"
                      >
                        {discord}
                      </a>
                      <EditDialog
                        label="Discord"
                        value={discord}
                        setValue={setDiscord}
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-right text-[13px] text-gray-500">Reddit</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://reddit.com/${reddit}`}
                        target="_blank"
                        rel="noreferrer noopener nofollow"
                        className="text-[13px] text-primary hover:underline"
                      >
                        {reddit}
                      </a>
                      <EditDialog
                        label="Reddit"
                        value={reddit}
                        setValue={setReddit}
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-right text-[13px] text-gray-500">Telegram</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://t.me/${telegram}`}
                        target="_blank"
                        rel="noreferrer noopener nofollow"
                        className="text-[13px] text-primary hover:underline"
                      >
                        {telegram}
                      </a>
                      <EditDialog
                        label="Telegram"
                        value={telegram}
                        setValue={setTelegram}
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inline AddTag Dialog */}
      {addTagOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm max-sm:h-dvh">
          <div
            className={cn(
              'rounded-2xl border p-6 w-[400px] max-w-[90vw]',
              'bg-white/98 backdrop-blur-2xl border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:bg-black/90 dark:backdrop-blur-2xl dark:border-[#3f96fe]/10 dark:shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
            )}
          >
            <div className="mb-4">
              <label className="block text-[11px] font-medium uppercase tracking-wide mb-2 text-gray-500">
                Tag
              </label>
              <input
                value={addTagVal}
                onChange={onChangeAddTagValue}
                autoFocus
                className={cn(
                  'w-full rounded-lg border-[1.5px] px-3 py-2 text-[13px] font-normal outline-none',
                  'bg-white border-gray-300 text-gray-900 focus:border-primary dark:bg-white/5 dark:border-white/15 dark:text-white dark:focus:border-primary'
                )}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleAddTagClose}
                className={cn(
                  'rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal',
                  'border-gray-300 hover:bg-gray-100 dark:border-white/15 dark:hover:bg-white/5'
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleAddTagOK}
                className={cn(
                  'rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal',
                  'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                )}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
