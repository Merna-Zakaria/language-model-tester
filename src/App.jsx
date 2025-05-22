import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('meta-llama/Llama-2-7b-chat-hf');
  const [response, setResponse] = useState('');
  const [evaluation, setEvaluation] = useState('');
  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const models = {
    'Llama-2-7B-Chat': 'meta-llama/Llama-2-7b-chat-hf',
    // 'Mistral-7B-Instruct': 'mistralai/Mistral-7B-Instruct-v0.3'
  };

  const evaluateResponse = (prompt, response) => {
    const promptWords = new Set(prompt.toLowerCase().split(/\s+/));
    const responseWords = new Set(response.toLowerCase().split(/\s+/));
    const commonWords = [...promptWords].filter(word => responseWords.has(word)).length;
    const keywordScore = promptWords.size > 0 ? commonWords / promptWords.size : 0;
    const lengthScore = response.split(/\s+/).length > 10;
    const failurePhrases = ["i don't know", "sorry", "not sure", "cannot help"];
    const coherenceScore = !failurePhrases.some(phrase => response.toLowerCase().includes(phrase));
    const understood = keywordScore > 0.3 && lengthScore && coherenceScore;
    return { result: understood ? '✔✔ Understood' : '❌ Not Understood', keywordScore };
  };

  const handleSubmit = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        { inputs: prompt, parameters: { max_new_tokens: 200, temperature: 0.7 } },
        { headers: { Authorization: `Bearer ${process.env.HF_TOKEN || 'your_hugging_face_token_here'}` } }
      );
      const generatedText = res.data[0]?.generated_text || res.data.generated_text || 'Error: No response';
      const evalResult = evaluateResponse(prompt, generatedText);
      setResponse(generatedText);
      setEvaluation(evalResult.result);
      setScore(evalResult.keywordScore);
      setHistory([{ prompt, response: generatedText, evaluation: evalResult.result }, ...history]);
    } catch (error) {
      setResponse(`Error: ${error.message}`);
      setEvaluation('❌ Error');
      setScore(0);
    }
    setLoading(false);
  };

  const handleClearHistory = () => setHistory([]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-4 text-blue-600">Language Model Understanding Tester</h1>
      <p className="text-gray-600 mb-6">Enter a prompt to test how well the language model understands it!</p>

      <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-md">
        <select
          className="w-full p-2 mb-4 border rounded"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          {Object.keys(models).map((name) => (
            <option key={name} value={models[name]}>{name}</option>
          ))}
        </select>
        <textarea
          className="w-full p-2 mb-4 border rounded resize-y"
          rows="4"
          placeholder="Enter your prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="flex space-x-4">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
            onClick={handleSubmit}
            disabled={loading || !prompt}
          >
            {loading ? 'Loading...' : 'Submit'}
          </button>
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            onClick={handleClearHistory}
          >
            Clear History
          </button>
        </div>
      </div>

      {response && (
        <div className="w-full max-w-2xl mt-6">
          <h2 className="text-xl font-semibold mb-2">Model Response</h2>
          <p className="bg-gray-50 p-4 rounded">{response}</p>
          <h2 className="text-xl font-semibold mt-4 mb-2">Evaluation</h2>
          <p className="bg-gray-50 p-4 rounded">{evaluation}</p>
          {score !== null && (
            <p className="text-gray-600 mt-2">Keyword Overlap Score: {score.toFixed(2)}</p>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="w-full max-w-2xl mt-6">
          <h2 className="text-xl font-semibold mb-2">Prompt History</h2>
          {history.map((item, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded mb-4">
              <p><strong>Prompt:</strong> {item.prompt}</p>
              <p><strong>Response:</strong> {item.response}</p>
              <p><strong>Evaluation:</strong> {item.evaluation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;