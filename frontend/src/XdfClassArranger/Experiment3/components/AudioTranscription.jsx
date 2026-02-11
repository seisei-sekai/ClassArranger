/**
 * Audio Transcription Component
 * 音频转写组件
 * 
 * Upload audio files and transcribe using OpenAI Whisper
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Auth/AuthContext';
import audioTranscriptionService from '../services/audioTranscriptionService';
import './AudioTranscription.css';

const AudioTranscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcriptionResult, setTranscriptionResult] = useState(null);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const fileInputRef = useRef(null);
  const textAreaRef = useRef(null);

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset states
    setError(null);
    setTranscriptionResult(null);
    setProgress(0);
    setCopySuccess(false);

    // Validate file
    const errors = audioTranscriptionService.validateFile(file);
    if (errors.length > 0) {
      setError(errors.join('; '));
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // Handle file upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle transcription
  const handleTranscribe = async () => {
    if (!selectedFile) {
      setError('请先选择音频文件');
      return;
    }

    // Double check authentication
    if (!user) {
      setError('请先登录后再使用转写功能');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    setIsTranscribing(true);
    setError(null);
    setProgress(0);
    setTranscriptionResult(null);

    try {
      const result = await audioTranscriptionService.transcribeAudio(
        selectedFile,
        (progressValue) => {
          setProgress(progressValue);
        }
      );

      setTranscriptionResult(result);
      setProgress(100);
    } catch (err) {
      console.error('Transcription error:', err);
      
      // Better error messages
      let errorMessage = err.message || '转写失败，请重试';
      
      if (errorMessage.includes('未登录')) {
        errorMessage = '登录已过期，请重新登录';
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('网络错误')) {
        errorMessage = '网络连接失败，请检查网络连接或稍后重试';
      } else if (errorMessage.includes('OpenAI API not configured')) {
        errorMessage = '服务未配置，请联系管理员配置 OpenAI API Key';
      }
      
      setError(errorMessage);
      setProgress(0);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!transcriptionResult?.text) return;

    try {
      await navigator.clipboard.writeText(transcriptionResult.text);
      setCopySuccess(true);
      
      // Reset copy success message after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      
      // Fallback: select text
      textAreaRef.current?.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (e) {
        setError('复制失败，请手动复制');
      }
    }
  };

  // Handle reset
  const handleReset = () => {
    setSelectedFile(null);
    setTranscriptionResult(null);
    setError(null);
    setProgress(0);
    setCopySuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '未知';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show loading state while checking auth
  if (!user) {
    return (
      <div className="audio-transcription-container">
        <div className="audio-transcription-header">
          <h2>🎙️ 一键转写</h2>
          <p className="subtitle">正在验证登录状态...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="audio-transcription-container">
      <div className="audio-transcription-header">
        <h2>🎙️ 一键转写</h2>
        <p className="subtitle">上传音频文件，使用 OpenAI Whisper 进行智能转写</p>
      </div>

      {/* File Upload Section */}
      <div className="upload-section">
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm,audio/*"
          onChange={handleFileSelect}
          className="file-input-hidden"
        />
        
        <div className="upload-area">
          <button 
            onClick={handleUploadClick}
            className="upload-button"
            disabled={isTranscribing}
          >
            📁 选择音频文件
          </button>
          
          {selectedFile && (
            <div className="file-info">
              <div className="file-name">
                <span className="file-icon">🎵</span>
                <span>{selectedFile.name}</span>
              </div>
              <div className="file-size">
                {formatFileSize(selectedFile.size)}
              </div>
            </div>
          )}

          <div className="upload-hint">
            支持格式: MP3, MP4, WAV, WEBM 等 (最大 100MB)
            <br />
            <small>大文件将自动分段处理，保持转写连续性</small>
          </div>
        </div>

        {selectedFile && !isTranscribing && !transcriptionResult && (
          <button 
            onClick={handleTranscribe}
            className="transcribe-button"
          >
            🚀 开始转写
          </button>
        )}
      </div>

      {/* Progress Section */}
      {isTranscribing && (
        <div className="progress-section">
          <div className="progress-label">
            {progress < 50 ? '📤 上传中...' : 
             progress < 60 ? '⏳ 服务器处理中...' : 
             progress < 90 ? '🔄 转写中...' : '✅ 完成中...'}
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-percentage">
            {progress}%
          </div>
          {progress >= 50 && progress < 90 && (
            <div className="progress-hint">
              <small>大文件处理需要时间，请耐心等待...</small>
            </div>
          )}
        </div>
      )}

      {/* Error Section */}
      {error && (
        <div className="error-section">
          <div className="error-message">
            ❌ {error}
          </div>
          <button onClick={handleReset} className="reset-button">
            重新选择
          </button>
        </div>
      )}

      {/* Result Section */}
      {transcriptionResult && (
        <div className="result-section">
          <div className="result-header">
            <h3>✨ 转写结果</h3>
            <div className="result-metadata">
              <span className="metadata-item">
                🌍 语言: {transcriptionResult.language?.toUpperCase() || '未知'}
              </span>
              <span className="metadata-item">
                ⏱️ 时长: {formatDuration(transcriptionResult.duration)}
              </span>
              {transcriptionResult.segments > 1 && (
                <span className="metadata-item">
                  ✂️ 分段: {transcriptionResult.segments} 段
                </span>
              )}
            </div>
          </div>

          <div className="result-content">
            <textarea
              ref={textAreaRef}
              className="transcription-text"
              value={transcriptionResult.text}
              readOnly
              rows={12}
            />
          </div>

          <div className="result-actions">
            <button 
              onClick={handleCopy}
              className="copy-button"
            >
              {copySuccess ? '✅ 已复制' : '📋 复制文本'}
            </button>
            <button 
              onClick={handleReset}
              className="reset-button"
            >
              🔄 转写新文件
            </button>
          </div>
        </div>
      )}

      {/* Tips Section */}
      {!isTranscribing && !transcriptionResult && (
        <div className="tips-section">
          <h4>💡 使用提示</h4>
          <ul>
            <li>支持多种音频格式：MP3、MP4、WAV、WEBM 等</li>
            <li>单个文件大小不超过 100MB</li>
            <li>大文件（>25MB）将自动分段处理，保持上下文连续性</li>
            <li>转写时间取决于音频长度，通常为音频时长的 10-20%</li>
            <li>支持多种语言自动识别</li>
            <li>转写结果可一键复制到剪贴板</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AudioTranscription;
