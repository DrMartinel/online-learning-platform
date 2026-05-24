'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  File as FileIcon, 
  Search, 
  UploadCloud, 
  Trash2, 
  Copy, 
  Download, 
  ChevronRight, 
  Home, 
  Loader2, 
  ExternalLink, 
  X, 
  Check, 
  ArrowLeft,
  Grid,
  List
} from 'lucide-react';
import { getMediaUrl } from '@/lib/supabase';

interface StorageItem {
  name: string;
  id?: string;
  created_at?: string;
  updated_at?: string;
  last_accessed_at?: string;
  metadata?: {
    size?: number;
    mimetype?: string;
    cacheControl?: string;
  } | null;
}

export default function ResourcesManager({ token }: { token: string }) {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [items, setItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Upload State
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clipboard success state
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Preview Modals
  const [previewItem, setPreviewItem] = useState<{ name: string; url: string; type: string } | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<StorageItem | null>(null);

  // Fetch directory list
  const fetchDirectory = async (path: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/storage?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error('Không thể tải danh sách tài nguyên.');
      const data: StorageItem[] = await res.json();
      
      // Virtual directories at the root to ensure clear separation
      if (path === '') {
        const virtualFolders = ['thumbnails', 'videos', 'documents'];
        const existingNames = new Set(data.map(item => item.name));
        
        const folderItems: StorageItem[] = virtualFolders
          .filter(f => !existingNames.has(f))
          .map(f => ({ name: f, metadata: null })); // metadata null indicates a folder
          
        setItems([...folderItems, ...data]);
      } else {
        setItems(data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory(currentPath);
  }, [currentPath]);

  // Navigate folder
  const navigateTo = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
  };

  // Navigate back using breadcrumb
  const navigateBreadcrumb = (index: number) => {
    if (index === -1) {
      setCurrentPath('');
      return;
    }
    const parts = currentPath.split('/');
    const newPath = parts.slice(0, index + 1).join('/');
    setCurrentPath(newPath);
  };

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploading(true);
    setUploadError('');

    try {
      const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const fullPath = currentPath ? `${currentPath}/${cleanName}` : cleanName;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', fullPath);

      const res = await fetch('/api/admin/storage', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Tải lên thất bại.');
      }

      // Refresh list
      await fetchDirectory(currentPath);
    } catch (err: any) {
      setUploadError(err.message || 'Lỗi xảy ra khi tải lên tệp tin.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete handler
  const handleDeleteFile = async (item: StorageItem) => {
    const filePath = currentPath ? `${currentPath}/${item.name}` : item.name;
    try {
      const res = await fetch(`/api/admin/storage?path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Không thể xóa tệp tin.');
      
      setItems(prev => prev.filter(i => i.name !== item.name));
      setDeleteConfirmItem(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa tệp tin.');
    }
  };

  // Helper: check item type
  const isFolder = (item: StorageItem) => !item.id && !item.metadata;

  const getFileType = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) return 'image';
    if (['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(ext || '')) return 'video';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext || '')) return 'document';
    return 'other';
  };

  const getFileIcon = (item: StorageItem) => {
    if (isFolder(item)) return <Folder className="w-10 h-10 text-blue-500 fill-blue-50/30" />;
    const type = getFileType(item.name);
    switch (type) {
      case 'image': return <ImageIcon className="w-10 h-10 text-emerald-500" />;
      case 'video': return <VideoIcon className="w-10 h-10 text-amber-500" />;
      case 'document': return <FileText className="w-10 h-10 text-purple-500" />;
      default: return <FileIcon className="w-10 h-10 text-gray-400" />;
    }
  };

  // Copy link handler
  const copyLink = (item: StorageItem) => {
    const relativePath = currentPath ? `${currentPath}/${item.name}` : item.name;
    const fullUrl = getMediaUrl(relativePath);
    navigator.clipboard.writeText(fullUrl);
    setCopiedPath(item.name);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  // Open Preview Modal
  const openPreview = (item: StorageItem) => {
    if (isFolder(item)) return;
    const relativePath = currentPath ? `${currentPath}/${item.name}` : item.name;
    const fullUrl = getMediaUrl(relativePath);
    const type = getFileType(item.name);
    setPreviewItem({
      name: item.name,
      url: fullUrl,
      type
    });
  };

  // Filtered lists
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (isFolder(item)) return matchesSearch; // folders are always shown
    
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && getFileType(item.name) === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Thư mục tài nguyên
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Quản trị và tải lên tất cả các tệp tin thumbnails, videos, tài liệu bài học.
          </p>
        </div>

        <div className="flex gap-2">
          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary-dark shadow-md active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải lên...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                Tải tệp lên
              </>
            )}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="*"
          />
        </div>
      </div>

      {uploadError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-2xl text-xs">
          {uploadError}
        </div>
      )}

      {/* Navigation Breadcrumbs & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-gray-50/50 dark:bg-gray-900/20 border border-gray-200/60 dark:border-gray-800/80 rounded-2xl">
        {/* Breadcrumbs */}
        <div className="flex items-center flex-wrap gap-1 text-sm font-semibold text-gray-600 dark:text-gray-300">
          <button 
            onClick={() => navigateBreadcrumb(-1)}
            className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center transition-colors"
          >
            <Home size={16} />
          </button>
          
          {currentPath && <ChevronRight size={14} className="text-gray-400" />}

          {currentPath.split('/').map((part, idx, arr) => (
            <div key={idx} className="flex items-center gap-1">
              <button 
                onClick={() => navigateBreadcrumb(idx)}
                className={`hover:text-primary transition-colors py-0.5 px-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 ${idx === arr.length - 1 ? 'text-primary' : ''}`}
              >
                {part}
              </button>
              {idx < arr.length - 1 && <ChevronRight size={14} className="text-gray-400" />}
            </div>
          ))}
        </div>

        {/* Search, filters, grid/list view */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Search box */}
          <div className="relative max-w-xs w-full">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm tệp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-primary outline-none transition-colors"
            />
          </div>

          {/* Filter dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:border-primary font-semibold"
          >
            <option value="all">Tất cả tệp</option>
            <option value="image">Hình ảnh</option>
            <option value="video">Video</option>
            <option value="document">Tài liệu</option>
            <option value="other">Tài nguyên khác</option>
          </select>

          {/* Grid/List View switcher */}
          <div className="flex bg-gray-200 dark:bg-gray-800 p-0.5 rounded-xl border border-gray-300/40 dark:border-gray-700/40">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-500'}`}
              title="Xem dạng lưới"
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-500'}`}
              title="Xem dạng danh sách"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Resource Explorer Grid / List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
          <p className="text-xs font-semibold">Đang tải danh sách tài nguyên...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl text-gray-400">
          <Folder className="w-16 h-16 mx-auto mb-3 text-gray-350 dark:text-gray-600 stroke-1" />
          <p className="text-sm font-semibold">Thư mục trống hoặc không tìm thấy tệp</p>
          <p className="text-xs text-gray-500 mt-1">Nhấn nút "Tải tệp lên" ở góc trên để thêm tài nguyên.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item, idx) => {
            const folder = isFolder(item);
            return (
              <div
                key={idx}
                className="group relative flex flex-col p-4 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl hover:shadow-md hover:border-primary/45 dark:hover:border-primary/45 transition-all cursor-pointer"
                onClick={() => folder ? navigateTo(item.name) : openPreview(item)}
              >
                {/* File Icon / Image Preview */}
                <div className="h-28 w-full rounded-xl bg-gray-50 dark:bg-gray-950 flex items-center justify-center overflow-hidden mb-3 relative group-hover:scale-[1.02] transition-transform">
                  {!folder && getFileType(item.name) === 'image' ? (
                    <img 
                      src={getMediaUrl(currentPath ? `${currentPath}/${item.name}` : item.name)} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    getFileIcon(item)
                  )}

                  {/* Actions overlay */}
                  {!folder && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => copyLink(item)}
                        className="p-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 transition-colors shadow-sm"
                        title="Copy Public URL"
                      >
                        {copiedPath === item.name ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                      <a
                        href={getMediaUrl(currentPath ? `${currentPath}/${item.name}` : item.name)}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 transition-colors shadow-sm"
                        title="Download"
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={() => setDeleteConfirmItem(item)}
                        className="p-2 rounded-xl bg-white hover:bg-red-50 text-red-600 transition-colors shadow-sm"
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Name & details */}
                <span className="text-xs font-bold text-gray-900 dark:text-gray-155 truncate" title={item.name}>
                  {item.name}
                </span>
                {!folder && item.metadata?.size && (
                  <span className="text-[10px] text-gray-400 mt-0.5">
                    {(item.metadata.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                )}
                {folder && (
                  <span className="text-[10px] text-primary mt-0.5 font-bold">
                    Thư mục
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-gray-150 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20 text-gray-450 uppercase font-semibold">
                <th className="px-6 py-4">Tên</th>
                <th className="px-6 py-4">Kích thước</th>
                <th className="px-6 py-4">Định dạng</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => {
                const folder = isFolder(item);
                const type = folder ? 'folder' : getFileType(item.name);
                return (
                  <tr 
                    key={idx}
                    onClick={() => folder ? navigateTo(item.name) : openPreview(item)}
                    className="border-b border-gray-100 dark:border-gray-850 hover:bg-gray-50/50 dark:hover:bg-gray-950/10 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-150 flex items-center gap-3">
                      <span className="p-1 bg-gray-50 dark:bg-gray-950 rounded-lg">
                        {folder ? <Folder className="w-5 h-5 text-blue-500" /> : getFileIcon(item)}
                      </span>
                      <span className="truncate max-w-xs">{item.name}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {folder ? '-' : item.metadata?.size ? `${(item.metadata.size / (1024 * 1024)).toFixed(2)} MB` : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">
                      {folder ? 'Thư mục' : item.metadata?.mimetype || type.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      {folder ? (
                        <button 
                          onClick={() => navigateTo(item.name)}
                          className="px-3 py-1.5 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold rounded-lg text-[10px] hover:bg-blue-100/50"
                        >
                          Mở
                        </button>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => copyLink(item)}
                            className="p-2 text-gray-400 hover:text-primary rounded-lg transition-colors"
                            title="Copy URL"
                          >
                            {copiedPath === item.name ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                          </button>
                          <a
                            href={getMediaUrl(currentPath ? `${currentPath}/${item.name}` : item.name)}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download size={14} />
                          </a>
                          <button
                            onClick={() => setDeleteConfirmItem(item)}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Asset Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-150 dark:border-gray-800">
              <span className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-md">
                {previewItem.name}
              </span>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 text-gray-400 hover:text-gray-750 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content Viewport */}
            <div className="p-6 flex items-center justify-center bg-gray-50 dark:bg-gray-950 min-h-[300px] max-h-[500px] overflow-auto">
              {previewItem.type === 'image' && (
                <img src={previewItem.url} alt={previewItem.name} className="max-w-full max-h-[400px] object-contain rounded-xl shadow-sm" />
              )}
              {previewItem.type === 'video' && (
                <video src={previewItem.url} controls className="w-full max-h-[400px] rounded-xl shadow-sm bg-black" autoPlay />
              )}
              {previewItem.type === 'document' && (
                <iframe src={previewItem.url} className="w-full h-[400px] rounded-xl border border-gray-200" title={previewItem.name}></iframe>
              )}
              {previewItem.type === 'other' && (
                <div className="text-center py-10 text-gray-400">
                  <FileIcon size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-xs">Định dạng tệp này không hỗ trợ xem trực tiếp.</p>
                  <a
                    href={previewItem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark"
                  >
                    Xem bên ngoài <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-150 dark:border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(previewItem.url);
                  alert('Đã sao chép link liên kết tệp!');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Copy size={12} />
                Copy Share URL
              </button>
              <a
                href={previewItem.url}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-colors"
              >
                <Download size={12} />
                Tải tệp xuống
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Xác nhận xóa tệp tin?
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Hành động này sẽ xóa vĩnh viễn tệp <span className="font-bold text-red-650 font-mono break-all">{deleteConfirmItem.name}</span> khỏi bộ nhớ lưu trữ hệ thống. Bài giảng/Khóa học tham chiếu đến file này có thể bị lỗi.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteFile(deleteConfirmItem)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-750 text-white shadow-sm"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
