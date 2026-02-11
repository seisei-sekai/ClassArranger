/**
 * Audio Transcription Service
 * 音频转写服务
 *
 * Handles audio file upload and transcription using OpenAI Whisper API
 * 使用OpenAI Whisper API处理音频文件上传和转写
 */

class AudioTranscriptionService {
  constructor() {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    this.baseURL = `${apiUrl}/ai/whisper/transcribe`;

    // Get auth token from localStorage (use same key as AuthContext)
    this.getAuthToken = () => {
      return localStorage.getItem("auth_token");
    };

    console.log("✅ Audio Transcription Service initialized");
    console.log(`📡 Backend endpoint: ${this.baseURL}`);
  }

  /**
   * Transcribe audio file
   * 转写音频文件
   *
   * @param {File} audioFile - Audio file to transcribe
   * @param {Function} onProgress - Progress callback (0-100)
   * @returns {Promise<Object>} Transcription result
   */
  async transcribeAudio(audioFile, onProgress) {
    // Validate file
    if (!audioFile) {
      throw new Error("请选择音频文件");
    }

    // Validate file type
    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/wav",
      "audio/webm",
    ];
    const allowedExtensions = [
      ".mp3",
      ".mp4",
      ".mpeg",
      ".mpga",
      ".m4a",
      ".wav",
      ".webm",
    ];

    const fileExt = "." + audioFile.name.split(".").pop().toLowerCase();

    if (
      !allowedTypes.includes(audioFile.type) &&
      !allowedExtensions.includes(fileExt)
    ) {
      throw new Error(
        `不支持的文件格式。支持的格式: ${allowedExtensions.join(", ")}`,
      );
    }

    // Validate file size (100MB limit with auto-segmentation)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (audioFile.size > maxSize) {
      throw new Error(
        `文件大小不能超过100MB (当前: ${(audioFile.size / 1024 / 1024).toFixed(2)}MB)`,
      );
    }

    // Create form data
    const formData = new FormData();
    formData.append("file", audioFile);

    try {
      // Get auth token
      const token = this.getAuthToken();
      if (!token) {
        throw new Error("未登录，请先登录");
      }

      // Upload starts - set to 10%
      if (onProgress) onProgress(10);

      // Make request with XMLHttpRequest for progress tracking
      const result = await this.uploadWithProgress(formData, token, onProgress);

      return result;
    } catch (error) {
      console.error("Transcription error:", error);

      // Handle different error types
      if (error.response) {
        const detail = error.response.data?.detail;
        if (typeof detail === "string") {
          throw new Error(detail);
        } else if (detail?.message) {
          throw new Error(detail.message);
        }
      }

      throw error;
    }
  }

  /**
   * Upload file with progress tracking
   * 上传文件并跟踪进度
   */
  uploadWithProgress(formData, token, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      console.log("[AudioTranscription] Starting upload to:", this.baseURL);

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          // Upload progress: 10% - 50%
          const uploadProgress = Math.round((e.loaded / e.total) * 40) + 10;
          console.log(
            `[AudioTranscription] Upload progress: ${uploadProgress}% (${e.loaded}/${e.total} bytes)`,
          );
          if (onProgress) onProgress(uploadProgress);
        }
      });

      // Upload complete, waiting for server response
      xhr.upload.addEventListener("loadend", () => {
        console.log(
          "[AudioTranscription] Upload complete, waiting for server processing...",
        );
        if (onProgress) onProgress(55); // Show 55% to indicate upload done, processing started
      });

      // Track response progress (if available)
      xhr.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          // Response progress: 55% - 90%
          const responseProgress = Math.round((e.loaded / e.total) * 35) + 55;
          console.log(
            `[AudioTranscription] Response progress: ${responseProgress}%`,
          );
          if (onProgress) onProgress(responseProgress);
        } else {
          // If length not computable, show incremental progress
          console.log(
            "[AudioTranscription] Processing... (server response pending)",
          );
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        console.log(
          "[AudioTranscription] Request complete, status:",
          xhr.status,
        );

        if (xhr.status >= 200 && xhr.status < 300) {
          // Processing: 90%
          if (onProgress) onProgress(90);

          try {
            const result = JSON.parse(xhr.responseText);
            console.log("[AudioTranscription] Transcription successful");

            // Complete: 100%
            if (onProgress) onProgress(100);

            resolve(result);
          } catch (e) {
            console.error("[AudioTranscription] Parse error:", e);
            reject(new Error("解析响应失败"));
          }
        } else {
          console.error(
            "[AudioTranscription] Request failed:",
            xhr.status,
            xhr.statusText,
          );
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.detail?.message || "转写失败"));
          } catch (e) {
            reject(new Error(`请求失败 (${xhr.status})`));
          }
        }
      });

      // Handle errors
      xhr.addEventListener("error", () => {
        console.error("[AudioTranscription] Network error");
        reject(new Error("网络错误，请检查连接"));
      });

      xhr.addEventListener("abort", () => {
        console.log("[AudioTranscription] Upload aborted");
        reject(new Error("上传已取消"));
      });

      xhr.addEventListener("timeout", () => {
        console.error("[AudioTranscription] Request timeout");
        reject(new Error("请求超时，文件可能太大或网络太慢"));
      });

      // Set timeout to 10 minutes (large files take time)
      xhr.timeout = 600000; // 10 minutes

      // Open and send request
      xhr.open("POST", this.baseURL);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      console.log("[AudioTranscription] Sending request...");
      xhr.send(formData);
    });
  }

  /**
   * Validate audio file before upload
   * 上传前验证音频文件
   */
  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push("请选择文件");
      return errors;
    }

    // Check file type
    const allowedExtensions = [
      ".mp3",
      ".mp4",
      ".mpeg",
      ".mpga",
      ".m4a",
      ".wav",
      ".webm",
    ];
    const fileExt = "." + file.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      errors.push(`不支持的文件格式。支持: ${allowedExtensions.join(", ")}`);
    }

    // Check file size
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      errors.push(
        `文件大小超过100MB限制 (当前: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
      );
    }

    if (file.size === 0) {
      errors.push("文件为空");
    }

    return errors;
  }
}

// Export singleton instance
export default new AudioTranscriptionService();
