'use client'
import React, { useState, useEffect } from "react";
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey: string = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "";

const GenerationPanel: React.FC = () => {
  const [userCode, setUserCode] = useState<string>("");
  const [generatedReport, setGeneratedReport] = useState<string>("");
  const [displayedReport, setDisplayedReport] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerateReport = async () => {
    if (!apiKey) {
      setGeneratedReport("Error: Gemini API key is missing.");
      return;
    }

    if (!userCode.trim()) {
      setGeneratedReport("Please enter your quantum circuit code first.");
      return;
    }

    setIsGenerating(true);
    setGeneratedReport("");
    setDisplayedReport("");

    const prompt = `Analyze the following quantum circuit code for errors and provide a detailed report:
    \nCode:\n${userCode}\n\nPerform quantum error checking, identify potential issues, and suggest improvements. Include:
    - Fault tolerance verification
    - Logical and physical qubit validation
    - Syndrome measurement analysis
    - Error correction efficiency
    - Execution timing impact
    Provide the report in a structured format.`;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
      const response = await model.generateContent(prompt);

      let generatedText = response.response.text()?.trim() || "Error generating report.";
      
      // Ensure the last word "undefined" is removed if it appears
      if (generatedText.endsWith("undefined")) {
        generatedText = generatedText.slice(0, -9).trim();
      }

      setGeneratedReport(generatedText);
    } catch (error) {
      console.error("Error generating report:", error);
      setGeneratedReport("Error generating report. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!generatedReport) return;

    let index = 0;
    setDisplayedReport("");

    const interval = setInterval(() => {
      if (index < generatedReport.length) {
        setDisplayedReport((prev) => prev + generatedReport[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [generatedReport]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedReport);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col md:flex-row w-full p-4 space-y-4 md:space-y-0">
      {/* Left: Code Input */}
      <div className="w-full md:w-1/2 flex flex-col p-4 border rounded-lg shadow-md">
        <h2 className="text-lg font-bold mb-2">Quantum Circuit Code</h2>
        <textarea 
          className="w-full h-40 md:h-96 border p-2 bg-gray-100 resize-none rounded-md" 
          value={userCode} 
          onChange={(e) => setUserCode(e.target.value)}
          placeholder="Enter your quantum circuit code here..."
        />
        <button 
          onClick={handleGenerateReport} 
          className="mt-4 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {/* Right: Report Generation */}
      <div className="w-full md:w-1/2 flex flex-col p-4 border rounded-lg shadow-md relative">
        <h2 className="text-lg font-bold mb-2">Generated Report</h2>
        <div className="w-full h-40 md:h-96 border p-2 bg-gray-100 overflow-auto rounded-md relative">
          <pre className="whitespace-pre-wrap text-sm md:text-base">
            {isGenerating ? "Generating..." : displayedReport || "Report will appear here..."}
          </pre>
        </div>
        {generatedReport && (
          <button 
            onClick={handleCopyToClipboard} 
            className="mt-2 p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            {isCopied ? "Copied!" : "Copy Report"}
          </button>
        )}
      </div>
    </div>
  );
};

export default GenerationPanel;
