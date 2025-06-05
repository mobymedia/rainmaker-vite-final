// Rainmaker.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import { CloudRain, Upload, Wallet, Zap } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import Papa from "papaparse";

export default function Rainmaker() {
  const [inputText, setInputText] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const history = localStorage.getItem("rainmaker-history");
      if (history) setInputText(history);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("rainmaker-history", inputText);
    }
  }, [inputText]);

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      complete: (results) => {
        const lines = results.data as string[][];
        const formatted = lines.map(row => row.join(",")).join("\n");
        setInputText(formatted);
        toast.success("CSV uploaded successfully");
      },
      error: () => toast.error("CSV parsing failed")
    });
  };

  const handleSend = () => {
    // simulate sending logic
    toast.success("Transaction submitted");
  };

  return (
    <>
      <Head>
        <title>Rainmaker – Multisend</title>
      </Head>
      <Toaster position="bottom-right" />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white p-8"
      >
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold flex gap-2 items-center mb-6">
            <CloudRain className="w-8 h-8" /> Rainmaker
          </h1>
          <textarea
            className="w-full h-40 p-4 text-sm rounded-xl bg-gray-800 text-white mb-4"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="0xabc123...,0.1\n0xdef456...,0.25"
          />
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="mb-4 block"
            ref={fileInputRef}
          />
          <input
            type="text"
            placeholder="Optional token address"
            className="w-full p-2 text-sm rounded-md bg-gray-700 mb-4"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
          />
          <div className="flex gap-4">
            <button
              onClick={handleSend}
              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-xl text-sm"
            >
              Send
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-xl text-sm"
            >
              <Upload className="w-4 h-4 inline-block mr-1" /> Upload CSV
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
