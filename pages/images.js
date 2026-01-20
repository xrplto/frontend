import { useState, useEffect, useCallback, useContext } from 'react';
import dynamic from 'next/dynamic';
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/AppContext';
import { Upload, Trash2, Copy, Check, Image as ImageIcon, X } from 'lucide-react';

const Header = dynamic(() => import('../src/components/Header'), { ssr: true });
const Footer = dynamic(() => import('../src/components/Footer'), { ssr: true });

const BASE_URL = 'https://api.xrpl.to';

function ImagesPage() {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [imageName, setImageName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${BASE_URL}/api/images`);
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      const data = await response.json();
      setImages(Array.isArray(data) ? data : data.images || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setImageName(file.name.replace(/\.[^/.]+$/, ''));
      } else {
        setError('Please select an image file');
      }
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setImageName(file.name.replace(/\.[^/.]+$/, ''));
      } else {
        setError('Please select an image file');
      }
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageName('');
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('image', selectedFile);
      if (imageName.trim()) {
        formData.append('name', imageName.trim());
      }

      const response = await fetch(`${BASE_URL}/api/images`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload image');
      }

      setSuccessMessage('Image uploaded successfully');
      clearSelection();
      fetchImages();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, [selectedFile, imageName, clearSelection, fetchImages]);

  const handleDelete = useCallback(
    async (filename) => {
      try {
        setError(null);
        const response = await fetch(`${BASE_URL}/api/images/${filename}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete image');
        }

        setSuccessMessage('Image deleted successfully');
        setDeleteConfirm(null);
        fetchImages();

        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        setError(err.message);
      }
    },
    [fetchImages]
  );

  const copyToClipboard = useCallback(async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  }, []);

  return (
    <div className={cn('flex min-h-screen flex-col', isDark ? 'bg-black' : 'bg-white')}>
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />
      <h1 className="sr-only">Image Upload</h1>

      <div
        className={cn(
          'flex-1 mt-4 pb-4 sm:pb-6',
          notificationPanelOpen ? 'px-4' : 'mx-auto max-w-[1920px] px-4'
        )}
      >
        {/* Page Header */}
        <div
          className={cn(
            'mb-4 rounded-xl border-[1.5px] p-4',
            isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg',
                  isDark ? 'bg-primary/10' : 'bg-primary/5'
                )}
              >
                <ImageIcon size={18} className="text-primary" />
              </div>
              <div>
                <h2
                  className={cn('text-[15px] font-medium', isDark ? 'text-white' : 'text-gray-900')}
                >
                  Image Upload
                </h2>
                <p className={cn('text-[11px]', isDark ? 'text-gray-500' : 'text-gray-500')}>
                  Upload and manage images
                </p>
              </div>
            </div>
            <span
              className={cn(
                'rounded-lg border-[1.5px] px-2.5 py-1 text-[11px] font-medium',
                isDark ? 'border-white/10 text-gray-400' : 'border-gray-200 text-gray-500'
              )}
            >
              {images.length} images
            </span>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 rounded-xl border-[1.5px] border-red-500/30 bg-red-500/10 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-500">{error}</p>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-400">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-xl border-[1.5px] border-green-500/30 bg-green-500/10 p-4">
            <p className="text-sm text-green-500">{successMessage}</p>
          </div>
        )}

        {/* Upload Section */}
        <div
          className={cn(
            'mb-4 rounded-xl border-[1.5px] p-4',
            isDark ? 'border-white/10 bg-white/[0.01]' : 'border-gray-200'
          )}
        >
          <div className={cn("flex items-center justify-between px-4 py-3 border-b border-l-2 border-l-primary/50 -mx-4 -mt-4 mb-4", isDark ? "border-b-white/[0.08]" : "border-b-gray-100")}>
            <p
              className={cn(
                'text-[11px] font-bold uppercase tracking-wider',
                isDark ? 'text-white/70' : 'text-gray-600'
              )}
            >
              Upload New Image
            </p>
          </div>

          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                'flex flex-col items-center justify-center rounded-xl border-[1.5px] border-dashed p-6 transition-all',
                dragActive
                  ? 'border-primary bg-primary/5'
                  : isDark
                    ? 'border-white/15 hover:border-primary/40 hover:bg-primary/5'
                    : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
              )}
            >
              <div
                className={cn(
                  'mb-3 flex h-10 w-10 items-center justify-center rounded-lg',
                  isDark ? 'bg-primary/10' : 'bg-primary/5'
                )}
              >
                <Upload size={18} className="text-primary" />
              </div>
              <p
                className={cn(
                  'mb-0.5 text-[13px] font-medium',
                  isDark ? 'text-white' : 'text-gray-900'
                )}
              >
                Drag and drop an image here
              </p>
              <p className={cn('mb-3 text-[11px]', isDark ? 'text-gray-500' : 'text-gray-500')}>
                PNG, JPG, GIF up to 10MB
              </p>
              <label
                className={cn(
                  'cursor-pointer rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-medium transition-all',
                  isDark
                    ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20'
                    : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                )}
              >
                Select Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <div
                  className={cn(
                    'relative h-48 w-full overflow-hidden rounded-xl border-[1.5px] sm:w-48',
                    isDark ? 'border-white/15' : 'border-gray-300'
                  )}
                >
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    onClick={clearSelection}
                    className="absolute right-2 top-2 rounded-lg bg-black/50 p-1.5 text-white hover:bg-black/70"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex flex-1 flex-col gap-3">
                  <div>
                    <label
                      className={cn(
                        'mb-1.5 block text-[11px] font-medium uppercase tracking-wide',
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      )}
                    >
                      Image Name (optional)
                    </label>
                    <input
                      type="text"
                      value={imageName}
                      onChange={(e) => setImageName(e.target.value)}
                      placeholder="Enter image name"
                      className={cn(
                        'w-full rounded-lg border-[1.5px] bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none',
                        isDark
                          ? 'border-white/15 text-white placeholder:text-gray-500'
                          : 'border-gray-300 text-gray-900 placeholder:text-gray-400'
                      )}
                    />
                  </div>

                  <div className={cn('text-[13px]', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    <p>File: {selectedFile.name}</p>
                    <p>Size: {(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal transition-colors',
                        uploading
                          ? 'cursor-not-allowed opacity-50'
                          : 'border-primary bg-primary text-white hover:bg-primary/90'
                      )}
                    >
                      {uploading ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          Upload
                        </>
                      )}
                    </button>
                    <button
                      onClick={clearSelection}
                      className={cn(
                        'rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal transition-colors',
                        isDark
                          ? 'border-white/15 hover:border-primary hover:bg-primary/5'
                          : 'border-gray-300 hover:border-primary hover:bg-gray-100'
                      )}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Images List */}
        <div
          className={cn(
            'rounded-xl border-[1.5px] p-4',
            isDark
              ? 'border-[rgba(59,130,246,0.08)] bg-[rgba(255,255,255,0.01)]'
              : 'border-gray-200'
          )}
        >
          <div className={cn("flex items-center justify-between px-4 py-3 border-b border-l-2 border-l-primary/50 -mx-4 -mt-4 mb-4", isDark ? "border-b-white/[0.08]" : "border-b-gray-100")}>
            <p
              className={cn(
                'text-[11px] font-bold uppercase tracking-wider',
                isDark ? 'text-white/70' : 'text-gray-600'
              )}
            >
              Uploaded Images
            </p>
            <button
              onClick={fetchImages}
              disabled={loading}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide transition-colors',
                isDark
                  ? 'text-primary hover:bg-primary/10'
                  : 'text-primary hover:bg-primary/5'
              )}
            >
              <svg
                className={cn('h-3 w-3', loading && 'animate-spin')}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <svg className="h-6 w-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : images.length === 0 ? (
            <div className="py-10 text-center">
              <div
                className={cn(
                  'mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl',
                  isDark ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-gray-50 border border-gray-100'
                )}
              >
                <ImageIcon size={22} className={cn(isDark ? 'text-primary/50' : 'text-primary')} />
              </div>
              <p
                className={cn(
                  'mb-0.5 text-[12px] font-semibold',
                  isDark ? 'text-white/50' : 'text-gray-500'
                )}
              >
                No images uploaded yet
              </p>
              <p className={cn('text-[11px]', isDark ? 'text-white/30' : 'text-gray-400')}>
                Upload your first image above
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
              {images.map((image) => {
                const imageUrl =
                  typeof image === 'string'
                    ? image
                    : image.url || `${BASE_URL}/api/images/${image.filename}`;
                const filename =
                  typeof image === 'string' ? image.split('/').pop() : image.filename || image.name;

                return (
                  <div
                    key={filename}
                    className={cn(
                      'group relative overflow-hidden rounded-xl border-[1.5px]',
                      isDark ? 'border-[rgba(59,130,246,0.12)]' : 'border-gray-200'
                    )}
                  >
                    <div className="aspect-square">
                      <img
                        src={imageUrl}
                        alt={filename}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Overlay with actions */}
                    <div
                      className={cn(
                        'absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100'
                      )}
                    >
                      <div className="p-2">
                        <p className="mb-2 truncate text-[11px] text-white">{filename}</p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => copyToClipboard(imageUrl)}
                            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/20 px-2 py-1.5 text-[11px] text-white backdrop-blur-sm hover:bg-white/30"
                          >
                            {copiedUrl === imageUrl ? <Check size={12} /> : <Copy size={12} />}
                            {copiedUrl === imageUrl ? 'Copied' : 'Copy URL'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(filename)}
                            className="flex items-center justify-center rounded-lg bg-red-500/80 px-2 py-1.5 text-white hover:bg-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Delete confirmation */}
                    {deleteConfirm === filename && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4">
                        <p className="mb-3 text-center text-[13px] text-white">
                          Delete this image?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(filename)}
                            className="rounded-lg bg-red-500 px-3 py-1.5 text-[12px] text-white hover:bg-red-600"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="rounded-lg bg-white/20 px-3 py-1.5 text-[12px] text-white hover:bg-white/30"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default ImagesPage;

export async function getStaticProps() {
  const ogp = {
    canonical: 'https://xrpl.to/images',
    title: 'Image Upload - XRPL.to',
    url: 'https://xrpl.to/images',
    desc: 'Upload and manage images on XRPL.to'
  };

  return {
    props: {
      ogp
    }
  };
}
