// Rainmaker.tsx
"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CloudRain, Upload, Wallet, Zap } from "lucide-react";
import Head from "next/head";
import Image from "next/image";

const CHAIN_CONFIG: Record<number, { name: string; contract: string; color?: string }> = {
  1: {
    name: "Ethereum",
    contract: "0xD375BA042B41A61e36198eAd6666BC0330649403",
    color: "#627eea",
  },
  56: {
    name: "BNB Chain",
    contract: "0x41c57d044087b1834379CdFE1E09b18698eC3A5A",
    color: "#f3ba2f",
  },
  42161: {
    name: "Arbitrum",
    contract: "0x06b9d57Ba635616F41E85D611b2DA58856176Fa9",
    color: "#28a0f0",
  },
  137: {
    name: "Polygon",
    contract: "0xD375BA042B41A61e36198eAd6666BC0330649403",
    color: "#8247e5",
  },
};

const ABI = [
  "function disperseEther(address[] recipients, uint256[] values) external payable",
  "function disperseToken(address token, address[] recipients, uint256[] values) external",
];

export default function Rainmaker() {
  const [inputText, setInputText] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [status, setStatus] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [theme, setTheme] = useState("light");
  const [gasEstimate, setGasEstimate] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const activeTheme = stored || (prefersDark ? "dark" : "light");
    setTheme(activeTheme);
    document.documentElement.classList.toggle("dark", activeTheme === "dark");

    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) setWalletAddress(accounts[0]);
      });
      window.ethereum.request({ method: "eth_chainId" }).then((id: string) => {
        setChainId(Number(id));
      });
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask not found");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setWalletAddress(accounts[0]);
    const id = await window.ethereum.request({ method: "eth_chainId" });
    setChainId(Number(id));
  }

  return (
    <>
      <Head>
        <title>Rainmaker – Multisend ETH & Tokens</title>
        <meta name="description" content="Rainmaker makes it easy to send crypto to many in one transaction." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        <div className="max-w-3xl mx-auto p-8 pt-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold flex items-center gap-2 text-blue-300">
              <CloudRain className="w-8 h-8" /> Rainmaker
            </h1>
            <div className="flex gap-3 items-center">
              <button onClick={toggleTheme} className="text-xl">
                {theme === "light" ? "🌙" : "🌞"}
              </button>
              {walletAddress ? (
                <span className="text-sm bg-white text-gray-900 px-3 py-1 rounded-xl">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              ) : (
                <button
                  onClick={connectWallet}
                  className="bg-blue-500 hover:bg-blue-600 transition px-4 py-2 text-sm rounded-xl flex items-center gap-1"
                >
                  <Wallet className="w-4 h-4" /> Connect Wallet
                </button>
              )}
            </div>
          </div>

          <div className="mb-8 text-center">
            <p className="text-lg text-blue-100">Paste wallet addresses + amounts in one box. One per line, format: address,amount</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-lg">
            <textarea
              className="w-full h-40 bg-gray-800 border border-gray-600 p-3 rounded-xl mb-4 text-sm text-white"
              placeholder="0x123...,0.1\n0xabc...,0.5"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
