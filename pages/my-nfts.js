import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import Web3Modal from 'web3modal'
import ConnectWallet from '../components/ConnectWallet'
import NftMarketplace from '../artifacts/contracts/NftMarketplace.sol/NftMarketplace.json'
import BasicNft from '../artifacts/contracts/BasicNft.sol/BasicNft.json'

export default function MyNFTs() {
  const [nfts, setNfts] = useState([])
  const [loading, setLoading] = useState(false)

  async function loadMyNFTs() {
    setLoading(true)
    try {
      const web3Modal = new Web3Modal()
      const connection = await web3Modal.connect()
      const provider = new ethers.providers.Web3Provider(connection)
      const signer = provider.getSigner()

      const marketplaceContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS,
        NftMarketplace.abi,
        signer
      )
      const nftContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_NFT_ADDRESS,
        BasicNft.abi,
        signer
      )

      const data = await nftContract.tokensOfOwner(await signer.getAddress())
      const items = await Promise.all(
        data.map(async (tokenId) => {
          const tokenUri = await nftContract.tokenURI(tokenId)
          const meta = await fetch(tokenUri)
          const metaData = await meta.json()
          const isListed = await marketplaceContract.isListed(
            process.env.NEXT_PUBLIC_NFT_ADDRESS,
            tokenId
          )

          let item = {
            tokenId: tokenId.toString(),
            image: metaData.image,
            name: metaData.name,
            description: metaData.description,
            isListed,
          }
          return item
        })
      )
      setNfts(items)
    } catch (error) {
      console.log('Error loading owned NFTs:', error)
    }
    setLoading(false)
  }

  async function listNFT(tokenId) {
    try {
      const web3Modal = new Web3Modal()
      const connection = await web3Modal.connect()
      const provider = new ethers.providers.Web3Provider(connection)
      const signer = provider.getSigner()

      const price = ethers.utils.parseUnits('0.1', 'ether')
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS,
        NftMarketplace.abi,
        signer
      )

      const listingFee = await contract.getListingFee()
      const transaction = await contract.listItem(
        process.env.NEXT_PUBLIC_NFT_ADDRESS,
        tokenId,
        price,
        { value: listingFee }
      )
      await transaction.wait()
      loadMyNFTs()
    } catch (error) {
      console.log('Error listing NFT:', error)
    }
  }

  useEffect(() => {
    loadMyNFTs()
  }, [])

  if (loading) return <div>กำลังโหลด...</div>
  if (!nfts.length) return <div>คุณยังไม่มี NFTs</div>

  return (
    <div className="flex flex-col min-h-screen">
      <ConnectWallet />
      <div className="flex justify-center">
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
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
                  {!nft.isListed && (
                    <button
                      className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
                      onClick={() => listNFT(nft.tokenId)}
                    >
                      ขาย NFT
                    </button>
                  )}
                  {nft.isListed && (
                    <p className="text-white text-center">กำลังขายในตลาด</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 