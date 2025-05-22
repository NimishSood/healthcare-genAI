import { useState } from 'react';
import axios from 'axios';

function App() {
  const [tab, setTab] = useState('document'); // "document" or "image"
  // --- Document Chat State ---
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  // --- Image Diagnostics State ---
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgResult, setImgResult] = useState('');
  const [imgLoading, setImgLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Document Chat Handlers ---
  const handleFileUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      await axios.post('http://127.0.0.1:5000/upload', formData);
      showToast('success', 'File uploaded successfully.');
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err.message);
      showToast('error', 'File upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!message) return;
    try {
      setLoading(true);
      const res = await axios.post('http://127.0.0.1:5000/chat', { message });
      setResponse(res.data.reply);
    } catch (err) {
      console.error("Chat failed:", err.response?.data || err.message);
      showToast('error', 'Error getting response');
    } finally {
      setLoading(false);
    }
  };

  // --- Image Diagnostics Handlers ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
    setImgResult('');
  };

  const handleImageAnalyze = async () => {
    if (!image) return;
    const formData = new FormData();
    formData.append('file', image);
    formData.append('prompt', imgPrompt || 'Describe any medical findings in this image.');

    try {
      setImgLoading(true);
      const res = await axios.post('http://127.0.0.1:5000/analyze-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImgResult(res.data.diagnosis);
    } catch (err) {
      console.error("Image analysis failed:", err.response?.data || err.message);
      showToast('error', 'Image analysis failed.');
    } finally {
      setImgLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-6">

        <h1 className="text-3xl font-bold text-blue-600 underline mb-4">
          GenAI Healthcare Assistant
        </h1>

        {/* Tab Switcher */}
        <div className="flex mb-4">
          <button
            onClick={() => setTab('document')}
            className={`flex-1 px-4 py-2 rounded-l-lg text-lg font-semibold ${
              tab === 'document'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-blue-100'
            } transition`}
          >
            Document Chat
          </button>
          <button
            onClick={() => setTab('image')}
            className={`flex-1 px-4 py-2 rounded-r-lg text-lg font-semibold ${
              tab === 'image'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-green-100'
            } transition`}
          >
            Image Diagnostics
          </button>
        </div>

        {/* --- Document Chat Tab --- */}
        {tab === 'document' && (
          <>
            {/* File Upload */}
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
              <input
                type="file"
                accept=".txt,.pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="text-sm"
              />
              <button
                onClick={handleFileUpload}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
              >
                Upload File
              </button>
            </div>

            {/* Question Form */}
            <div>
              <textarea
                rows="4"
                placeholder="Ask a medical question..."
                className="w-full border border-gray-300 p-3 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                onClick={handleAsk}
                className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded transition"
              >
                Ask AI
              </button>
            </div>

            {/* Response Display */}
            {loading && <p className="text-center text-gray-500 italic">Thinking...</p>}
            {response && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-md shadow-inner">
                <p className="text-gray-700 font-semibold mb-2">AI Response:</p>
                <p className="text-gray-800 whitespace-pre-line">{response}</p>
              </div>
            )}
          </>
        )}

        {/* --- Image Diagnostics Tab --- */}
        {tab === 'image' && (
          <>
            <div className="flex flex-col gap-3">
              <label className="font-medium">Upload a medical image (.jpg, .jpeg, .png):</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageChange}
                className="text-sm"
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Uploaded Preview"
                  className="max-w-full max-h-64 mt-2 mb-2 rounded-md border shadow"
                />
              )}
              <textarea
                rows="3"
                placeholder="Describe the diagnostic task, e.g. 'Is there a fracture?' or leave blank for general findings."
                className="w-full border border-gray-300 p-3 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
                value={imgPrompt}
                onChange={(e) => setImgPrompt(e.target.value)}
              />
              <button
                onClick={handleImageAnalyze}
                className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded transition"
                disabled={imgLoading || !image}
              >
                {imgLoading ? 'Analyzing...' : 'Analyze Image'}
              </button>
            </div>
            {/* Image Diagnostic Result */}
            {imgLoading && <p className="text-center text-gray-500 italic">Analyzing image...</p>}
            {imgResult && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-md shadow-inner mt-4">
                <p className="text-gray-700 font-semibold mb-2">AI Image Diagnostic:</p>
                <p className="text-gray-800 whitespace-pre-line">{imgResult}</p>
              </div>
            )}
          </>
        )}

      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 px-4 py-2 rounded shadow-lg text-white z-50 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
