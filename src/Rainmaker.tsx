"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

const RAINMAKER_CONTRACT_ADDRESS = "0xD375BA042B41A61e36198eAd6666BC0330649403";
const ABI = [
  "function disperseEther(address[] recipients, uint256[] values) external payable",
  "function disperseToken(address token, address[] recipients, uint256[] values) external"
];

export default function Rainmaker() {
  const [recipientsText, setRecipientsText] = useState("");
  const [amountsText, setAmountsText] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [status, setStatus] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask not found");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setWalletAddress(accounts[0]);
  }

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      });
    }
  }, []);

  async function handleDisperse() {
    try {
      if (!window.ethereum) throw new Error("No wallet found");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(RAINMAKER_CONTRACT_ADDRESS, ABI, signer);

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
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-8 md:px-16">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-4 text-right">
          {walletAddress ? (
            <span className="text-sm text-gray-700">
              Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          ) : (
            <button
              onClick={connectWallet}
              className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600"
            >
              Connect Wallet
            </button>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">Rainmaker</h1>

        <label className="block font-medium mb-1">Recipient Addresses (one per line)</label>
        <textarea
          className="w-full border p-2 rounded mb-4 h-32 resize-none"
          placeholder="0x123...\n0xabc..."
          value={recipientsText}
          onChange={(e) => setRecipientsText(e.target.value)}
        />

        <label className="block font-medium mb-1">Amounts (one per line, matching order)</label>
        <textarea
          className="w-full border p-2 rounded mb-4 h-32 resize-none"
          placeholder="0.01\n0.5"
          value={amountsText}
          onChange={(e) => setAmountsText(e.target.value)}
        />

        <label className="block font-medium mb-1">Token Address (leave blank to send ETH)</label>
        <input
          className="w-full border p-2 rounded mb-6"
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

        {status && <p className="text-center text-sm mt-4 text-gray-700">{status}</p>}
      </div>
    </div>
  );
}
