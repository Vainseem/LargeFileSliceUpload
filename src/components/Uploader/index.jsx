import { message, Progress } from 'antd';
import { useRef, useState } from 'react';
import { uploadFile, } from '../../api';
import { chunkFile, hashChunk } from '../../utils/chunk';
import './index.css';
export default function Uploader() {
  const [messageApi, contextHolder] = message.useMessage();
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [uploadingList, setUploadingList] = useState([]);
  const uploadAreaRef = useRef(null);
  const uploadListRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentSlice = useRef(0);
  const silceLen = useRef(0);
  const triggerFileInput = () => {
    fileInputRef.current.click();
  }
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFile(file);
  }

  const handleUpload = async () => {
    if (!file) {
      messageApi.error('请先选择文件');
      return;
    }

    try {
      setUploading(true);
      setProgress(0);
      setUploadCount(0);
      currentSlice.current = 0;
      if (uploadListRef.current) {
        uploadListRef.current.innerHTML = '';
      }
      messageApi.info('开始分片...');
      const chunkList = chunkFile(file, 1024 * 1024 * 100);

      messageApi.info('开始计算hash...');
      const hashedChunkList = await hashChunk(chunkList);
      // 并发上传所有chunk
      messageApi.info('开始上传...');
      const uploadPromises = hashedChunkList.map(async (chunk) => {
        const formData = new FormData();
        formData.append('chunk', chunk.chunk);
        formData.append('hash', chunk.hash);
        formData.append('index', chunk.index);
        formData.append('start', chunk.start);
        formData.append('end', chunk.end);
        formData.append('name', chunk.name);
        const res = await uploadFile(formData);
        return res;
      });
      silceLen.current = uploadPromises.length;


      for (const promise of uploadPromises) {
        const index = currentSlice.current + 1;
        currentSlice.current++;
        setProgress(Math.floor((index / silceLen.current) * 100));
        const res = await promise;
        const statusIcon = res.data.file.exists ? '✓' : '↑';
        const statusClass = res.data.file.exists ? 'status-skip' : 'status-upload';
        uploadingList.push({
          name: res.data.file.name,
          index: res.data.file.index,
          statusClass: statusClass,
          message: res.data.message,
          statusIcon: statusIcon,
        });
        uploadListRef.current.innerHTML += `
          <div class="upload-item ${statusClass}">
            <div class="item-header">
              <span class="item-icon">${statusIcon}</span>
              <span class="item-name">切片 #${parseInt(res.data.file.index) + 1}</span>
            </div>
            <div class="item-message">${res.data.message}</div>
            <div class="item-details">${res.data.file.name}</div>
          </div>
        `;
        setUploadCount(prev => prev + 1);
        console.log('上传结果', res);
      }
      messageApi.success('所有分片上传完成！');
      setProgress(100);
    } catch (err) {
      messageApi.error('上传失败');
      console.log('上传失败', err);
    } finally {
      setUploading(false);
    }
  }

  const handleReset = () => {
    setFile(null);
    currentSlice.current = 0;
    silceLen.current = 0;
    setProgress(0);
    setUploading(false);
    setUploadingList([]);

  }
  return (
    <>
      {contextHolder}
      <div className="app-container">
        <div className="main-content">
          {/* 标题区域 */}
          <div className="header-section">
            <h1 className="app-title">大文件分片上传</h1>
          </div>

          {/* 进度条区域 */}
          {uploading && (
            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-label">上传进度</span>
                <span className="progress-percent">{progress}%</span>
              </div>
              <Progress
                percent={progress}
                status="active"
                strokeColor={{
                  '0%': '#6366f1',
                  '100%': '#8b5cf6',
                }}
                showInfo={false}
              />
            </div>
          )}

          {/* 主要内容区域 */}
          <div className="content-grid">
            {/* 左侧：文件上传区 */}
            <div className="upload-section">
              <div className="section-header">
                <h2 className="section-title">选择文件</h2>
              </div>
              <div
                onClick={triggerFileInput}
                ref={uploadAreaRef}
                className={`upload-zone ${file ? 'has-file' : ''} ${uploading ? 'uploading' : ''}`}
              >
                {file ? (
                  <div className="file-preview">
                    <div className="file-icon-wrapper">
                      <svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                      </svg>
                    </div>
                    <div className="file-info">
                      <div className="file-name">{file.name}</div>
                      <div className="file-meta">
                        <span className="file-size">{(file.size / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                        <span className="file-separator">•</span>
                        <span className="file-type">{file.type || '未知类型'}</span>
                      </div>
                    </div>
                    {!uploading && (
                      <button
                        className="change-file-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerFileInput();
                        }}
                      >
                        更换文件
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon-wrapper">
                      <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                    </div>
                    <div className="upload-text">
                      <span className="upload-primary-text">点击选择文件</span>
                      <span className="upload-secondary-text">或拖拽文件到此处</span>
                    </div>
                  </div>
                )}
              </div>
              <button
                disabled={uploading || !file}
                onClick={handleUpload}
                className={`upload-button ${uploading ? 'uploading' : ''}`}
              >
                {uploading ? (
                  <>
                    <span className="button-loader"></span>
                    <span>上传中...</span>
                  </>
                ) : (
                  <>
                    <svg className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span>开始上传</span>
                  </>
                )}
              </button>
              <button
                disabled={uploading || !file}
                onClick={handleReset}
                className={`upload-button`}
              >
                <svg className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 21l-12-18h24z"></path>
                </svg>
                <span>重置</span>
              </button>
            </div>

            {/* 右侧：上传记录列表 */}
            <div className="list-section">
              <div className="section-header">
                <h2 className="section-title">上传记录</h2>
                {uploadCount > 0 && <span className="list-count">{uploadCount} 个切片</span>}
              </div>
              <div ref={uploadListRef} className="upload-list">
                {uploadingList.length === 0 ? (
                  <div className="empty-list">
                    <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p className="empty-text">暂无上传记录</p>
                    <p className="empty-hint">开始上传后，切片记录将显示在这里</p>
                  </div>
                ) : (
                  <div className="upload-list-content">
                    {uploadingList.map((item) => (
                      <div key={item.index} className={`upload-item ${item.statusClass}`}>
                        <div className="item-header">
                          <span className="item-icon">{item.statusIcon}</span>
                          <span className="item-name">切片 #${item.index}</span>
                        </div>
                        <div className="item-message">{item.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <input ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} type="file" />
      </div>
    </>
  )
}