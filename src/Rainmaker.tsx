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

const ABI = [
  "function disperseEther(address[] recipients, uint256[] values) external payable",
  "function disperseToken(address token, address[] recipients, uint256[] values) external"
];

const CONTRACTS: Record<number, string> = {
  56: "0x41c57d044087b1834379CdFE1E09b18698eC3A5A",
  42161: "0x06b9d57Ba635616F41E85D611b2DA58856176Fa9",
  137: "0xD375BA042B41A61e36198eAd6666BC0330649403"
};

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

  const handleSend = async () => {
    if (!window.ethereum) return toast.error("No wallet found");

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    try {
      const network = await provider.getNetwork();
      const chainId = network.chainId;

      if (!CONTRACTS[chainId]) {
        return toast.error("Unsupported network");
      }

      const contract = new ethers.Contract(CONTRACTS[chainId], ABI, signer);

      const lines = inputText.trim().split("\n");
      const recipients: string[] = [];
      const amounts: ethers.BigNumber[] = [];
      let total = ethers.BigNumber.from(0);

      for (const line of lines) {
        const [addr, amount] = line.split(",").map(s => s.trim());
        if (!ethers.utils.isAddress(addr)) throw new Error(`Invalid address: ${addr}`);
        const parsed = ethers.utils.parseUnits(amount, 18);
        recipients.push(addr);
        amounts.push(parsed);
        total = total.add(parsed);
      }

      let tx;

      if (tokenAddress && ethers.utils.isAddress(tokenAddress)) {
        tx = await contract.disperseToken(tokenAddress, recipients, amounts);
      } else {
        tx = await contract.disperseEther(recipients, amounts, { value: total });
      }

      toast.success("Transaction sent: " + tx.hash);
      await tx.wait();
      toast.success("Transaction confirmed ✅");
    } catch (err: any) {
      toast.error(err.message || "Transaction failed");
    }
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
