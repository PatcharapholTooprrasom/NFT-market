import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import Web3Modal from 'web3modal'
import Link from 'next/link'
import ConnectWallet from '../components/ConnectWallet'
import NftMarketplace from '../artifacts/contracts/NftMarketplace.sol/NftMarketplace.json'
import BasicNft from '../artifacts/contracts/BasicNft.sol/BasicNft.json'

export default function Home() {
  const [nfts, setNfts] = useState([])
  const [loading, setLoading] = useState(false)

  async function loadNFTs() {
    setLoading(true)
    try {
      const provider = new ethers.providers.JsonRpcProvider()
      const marketplaceContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS,
        NftMarketplace.abi,
        provider
      )
      const nftContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_NFT_ADDRESS,
        BasicNft.abi,
        provider
      )

      const data = await marketplaceContract.getAllListedNFTs()
      const items = await Promise.all(
        data.map(async (i) => {
          const tokenUri = await nftContract.tokenURI(i.tokenId)
          const meta = await fetch(tokenUri)
          const metaData = await meta.json()
          let item = {
            price: i.price.toString(),
            tokenId: i.tokenId.toString(),
            seller: i.seller,
            image: metaData.image,
            name: metaData.name,
            description: metaData.description,
          }
          return item
        })
      )
      setNfts(items)
    } catch (error) {
      console.log('Error loading NFTs:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadNFTs()
  }, [])

  async function buyNft(nft) {
    try {
      const web3Modal = new Web3Modal()
      const connection = await web3Modal.connect()
      const provider = new ethers.providers.Web3Provider(connection)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS,
        NftMarketplace.abi,
        signer
      )
      const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')
      const transaction = await contract.buyItem(
        process.env.NEXT_PUBLIC_NFT_ADDRESS,
        nft.tokenId,
        { value: price }
      )
      await transaction.wait()
      loadNFTs()
    } catch (error) {
      console.log('Error buying NFT:', error)
    }
  }

  if (loading) return <div>กำลังโหลด...</div>

  return (
    <div className="flex flex-col min-h-screen">
      <ConnectWallet />
      <div className="flex justify-center mb-4">
        <Link href="/create">
          <button className="bg-pink-500 text-white font-bold py-2 px-4 rounded mr-4">
            สร้าง NFT
          </button>
        </Link>
        <Link href="/my-nfts">
          <button className="bg-pink-500 text-white font-bold py-2 px-4 rounded">
            NFTs ของฉัน
          </button>
        </Link>
      </div>
      <div className="flex justify-center">
        <div className="px-4" style={{ maxWidth: '1600px' }}>
          {!nfts.length && <h1 className="px-20 py-10 text-3xl">ไม่มี NFTs ที่ขายอยู่</h1>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <Link href={`/nft/${nft.tokenId}`}>
                  <img
                    src={nft.image}
                    style={{ height: '300px', width: '100%', objectFit: 'cover' }}
                  />
                  <div className="p-4">
                    <p style={{ height: '64px' }} className="text-2xl font-semibold">
                      {nft.name}
                    </p>
                    <div style={{ height: '70px', overflow: 'hidden' }}>
                      <p className="text-gray-400">{nft.description}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-black">
                    <p className="text-2xl font-bold text-white">{nft.price} ETH</p>
                    <button
                      className="mt-4 w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
                      onClick={(e) => {
                        e.preventDefault()
                        buyNft(nft)
                      }}
                    >
                      ซื้อ
                    </button>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 