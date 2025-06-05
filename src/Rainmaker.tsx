"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

const CHAIN_CONFIG: Record<number, { name: string; contract: string }> = {
  1: {
  name: "Ethereum",
  contract: "0xD375BA042B41A61e36198eAd6666BC0330649403",
  },
  56: {
    name: "BNB Chain",
    contract: "0x41c57d044087b1834379CdFE1E09b18698eC3A5A",
  },
  42161: {
    name: "Arbitrum",
    contract: "0x06b9d57Ba635616F41E85D611b2DA58856176Fa9",
  },
  137: {
    name: "Polygon",
    contract: "0xD375BA042B41A61e36198eAd6666BC0330649403",
  },
};

const ABI = [
  "function disperseEther(address[] recipients, uint256[] values) external payable",
  "function disperseToken(address token, address[] recipients, uint256[] values) external",
];

export default function Rainmaker() {
  const [recipientsText, setRecipientsText] = useState("");
  const [amountsText, setAmountsText] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [status, setStatus] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const activeTheme = stored || (prefersDark ? "dark" : "light");
    setTheme(activeTheme);
    document.documentElement.classList.toggle("dark", activeTheme === "dark");

    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
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

  async function handleDisperse() {
    try {
      if (!window.ethereum) throw new Error("No wallet found");
      if (!chainId || !CHAIN_CONFIG[chainId]) throw new Error("Unsupported chain");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CHAIN_CONFIG[chainId].contract, ABI, signer);

      const recipients = recipientsText.split("\n").map(line => line.trim()).filter(line => line);
      const amounts = amountsText.split("\n").map(line => ethers.parseEther(line.trim()));

      if (recipients.length !== amounts.length) throw new Error("Address and amount count mismatch");

      if (tokenAddress) {
        const tx = await contract.disperseToken(tokenAddress, recipients, amounts);
        await tx.wait();
        setStatus("Token dispersed successfully!");
      } else {
        const total = amounts.reduce((acc, cur) => acc + cur, 0n);
        const tx = await contract.disperseEther(recipients, amounts, { value: total });
        await tx.wait();
        setStatus("ETH dispersed successfully!");
      }
    } catch (err: any) {
      setStatus("Error: " + err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-10 px-4 sm:px-8 md:px-16 text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 relative">
        <div className="absolute top-4 right-4 flex items-center gap-4">
          <button onClick={toggleTheme}>
            {theme === "light" ? "🌙" : "🌞"}
          </button>
          {walletAddress ? (
            <span className="text-sm">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
          ) : (
            <button
              onClick={connectWallet}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
            >
              Connect Wallet
            </button>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-6 text-center text-blue-700 dark:text-blue-400">Rainmaker</h1>

        {chainId && !CHAIN_CONFIG[chainId] && (
          <p className="text-red-500 text-sm text-center mb-4">Unsupported chain. Please switch to BNB, Arbitrum, or Polygon.</p>
        )}

        <label className="block font-medium mb-1">Recipient Addresses (one per line)</label>
        <textarea
          className="w-full border p-2 rounded mb-4 h-32 resize-none dark:bg-gray-700 dark:border-gray-600"
          placeholder="0x123...\n0xabc..."
          value={recipientsText}
          onChange={(e) => setRecipientsText(e.target.value)}
        />

        <label className="block font-medium mb-1">Amounts (one per line, matching order)</label>
        <textarea
          className="w-full border p-2 rounded mb-4 h-32 resize-none dark:bg-gray-700 dark:border-gray-600"
          placeholder="0.01\n0.5"
          value={amountsText}
          onChange={(e) => setAmountsText(e.target.value)}
        />

        <label className="block font-medium mb-1">Token Address (leave blank to send ETH)</label>
        <input
          className="w-full border p-2 rounded mb-6 dark:bg-gray-700 dark:border-gray-600"
          placeholder="0xTOKEN..."
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
        />

        <button
          onClick={handleDisperse}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl"
        >
          Send
        </button>

        {status && <p className="text-center text-sm mt-4 text-gray-700 dark:text-gray-300">{status}</p>}
      </div>
    </div>
  );
}
