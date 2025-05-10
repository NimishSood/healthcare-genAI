import { useState } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    console.log("Selected file:", file);

    try {
      setLoading(true);
      await axios.post('http://127.0.0.1:5000/upload', formData);
      alert('File uploaded successfully.');
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err.message);
      alert('File upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!message) return;
    try {
      setLoading(true);
      const res = await axios.post('http://127.0.0.1:5000/chat', {
        message,
      });
      setResponse(res.data.reply);
    } catch (err) {
      console.error("Chat failed:", err.response?.data || err.message);
      alert('Error getting response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-2xl font-semibold mb-4">Healthcare AI Assistant</h1>

      <div className="mb-4">
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button
          onClick={handleFileUpload}
          className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Upload
        </button>
      </div>

      <div className="mb-4 w-full max-w-md">
        <textarea
          rows="4"
          placeholder="Ask a medical question..."
          className="w-full border p-2 rounded"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          onClick={handleAsk}
          className="mt-2 bg-green-600 text-white px-4 py-2 rounded"
        >
          Ask
        </button>
      </div>

      {loading && <p className="text-gray-600">Loading...</p>}
      {response && (
        <div className="w-full max-w-md bg-white p-4 rounded shadow">
          <p className="font-semibold text-gray-700">Response:</p>
          <p className="mt-2 text-gray-800">{response}</p>
        </div>
      )}
    </div>
  );
}

export default App;
