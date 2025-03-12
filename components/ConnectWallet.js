import { useState, useEffect } from 'react'
import Web3Modal from 'web3modal'
import { ethers } from 'ethers'

export default function ConnectWallet() {
  const [account, setAccount] = useState('')
  const [connected, setConnected] = useState(false)

  async function connect() {
    try {
      const web3Modal = new Web3Modal()
      const connection = await web3Modal.connect()
      const provider = new ethers.providers.Web3Provider(connection)
      const signer = provider.getSigner()
      const address = await signer.getAddress()
      setAccount(address)
      setConnected(true)
    } catch (error) {
      console.log('Error connecting wallet:', error)
    }
  }

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          setConnected(true)
        } else {
          setAccount('')
          setConnected(false)
        }
      })
    }
  }, [])

  return (
    <div className="flex justify-end p-4">
      {connected ? (
        <button className="bg-gray-800 text-white font-bold py-2 px-4 rounded">
          {account.slice(0, 6)}...{account.slice(-4)}
        </button>
      ) : (
        <button
          onClick={connect}
          className="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded"
        >
          เชื่อมต่อกระเป๋าเงิน
        </button>
      )}
    </div>
  )
} 