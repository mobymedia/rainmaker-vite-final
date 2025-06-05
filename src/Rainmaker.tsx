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

const COMMON_TOKENS = [
  { name: "USDC", address: "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" },
  { name: "DAI", address: "0x6b175474e89094c44da98b954eedeac495271d0f" },
  { name: "USDT", address: "0xdac17f958d2ee523a2206206994597c13d831ec7" },
];

const ERC20_ABI = ["function decimals() view returns (uint8)", "function balanceOf(address) view returns (uint256)"];

const ABI = [
  "function disperseEther(address[] recipients, uint256[] values) external payable",
  "function disperseToken(address token, address[] recipients, uint256[] values) external",
];

export default function Rainmaker() {
  const [inputText, setInputText] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [status, setStatus] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [theme, setTheme] = useState("light");
  const [gasEstimate, setGasEstimate] = useState<string>("");
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [tokenDecimals, setTokenDecimals] = useState<number>(18);
  const [tokenBalance, setTokenBalance] = useState<string>("");

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

  useEffect(() => {
    if (!tokenAddress || !ethers.utils.isAddress(tokenAddress) || !walletAddress || !window.ethereum) return;
    const fetchTokenInfo = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const [decimals, balance] = await Promise.all([
        token.decimals(),
        token.balanceOf(walletAddress),
      ]);
      setTokenDecimals(decimals);
      setTokenBalance(ethers.utils.formatUnits(balance, decimals));
    };
    fetchTokenInfo();
  }, [tokenAddress, walletAddress]);

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

  const parseInput = () => {
    try {
      const lines = inputText.split("\n").filter(Boolean);
      const addresses: string[] = [];
      const values: bigint[] = [];
      for (const line of lines) {
        const [addr, amt] = line.split(",").map((s) => s.trim());
        if (!ethers.utils.isAddress(addr)) throw new Error(`Invalid address: ${addr}`);
        addresses.push(addr);
        values.push(ethers.utils.parseUnits(amt, tokenAddress ? tokenDecimals : 18));
      }
      return { addresses, values };
    } catch (e: any) {
      alert(e.message);
      throw e;
    }
  };

  const sendToken = async () => {
    if (!chainId || !window.ethereum || !ethers.utils.isAddress(tokenAddress)) {
      alert("Invalid token address");
      return;
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contractAddress = CHAIN_CONFIG[chainId].contract;
    const contract = new ethers.Contract(contractAddress, ABI, signer);
    try {
      const { addresses, values } = parseInput();
      const tx = await contract.disperseToken(tokenAddress, addresses, values);
      setStatus("Token transaction sent: " + tx.hash);
      await tx.wait();
      setStatus("Token transaction confirmed ✅");
    } catch (e: any) {
      setStatus("Token Error: " + (e.message || e.toString()));
    }
  };

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

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="ERC-20 token address"
                className="flex-grow bg-gray-700 text-white border border-gray-500 p-2 rounded-md text-sm"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
              />
              <select
                onChange={(e) => setTokenAddress(e.target.value)}
                className="bg-gray-700 text-white border border-gray-500 p-2 rounded-md text-sm"
              >
                <option value="">Select Token</option>
                {COMMON_TOKENS.map((t) => (
                  <option key={t.address} value={t.address}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {tokenBalance && (
              <p className="text-sm text-green-200">Your balance: {tokenBalance}</p>
            )}

            <div className="flex flex-wrap gap-4 mt-4">
              <button
                onClick={estimateGas}
                className="bg-purple-500 hover:bg-purple-600 px-4 py-2 text-sm rounded-xl"
              >
                Estimate Gas
              </button>
              <button
                onClick={sendEther}
                className="bg-green-500 hover:bg-green-600 px-4 py-2 text-sm rounded-xl"
              >
                Send ETH
              </button>
              <button
                onClick={sendToken}
                className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 text-sm rounded-xl"
              >
                Send Token
              </button>
            </div>
            {gasEstimate && <p className="mt-2 text-sm text-blue-200">Estimated Gas: {gasEstimate}</p>}
            {status && <p className="mt-2 text-sm text-yellow-200">{status}</p>}
          </div>
        </div>
      </div>
    </>
  );
}
