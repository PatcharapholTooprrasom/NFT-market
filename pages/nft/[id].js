import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { ethers } from 'ethers'
import Web3Modal from 'web3modal'
import ConnectWallet from '../../components/ConnectWallet'
import NftMarketplace from '../../artifacts/contracts/NftMarketplace.sol/NftMarketplace.json'
import BasicNft from '../../artifacts/contracts/BasicNft.sol/BasicNft.json'

export default function NFTDetail() {
  const router = useRouter()
  const { id } = router.query
  const [nft, setNft] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadNFT() {
    if (!id) return
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

      const tokenUri = await nftContract.tokenURI(id)
      const meta = await fetch(tokenUri)
      const metaData = await meta.json()

      const isListed = await marketplaceContract.isListed(
        process.env.NEXT_PUBLIC_NFT_ADDRESS,
        id
      )
      let price = '0'
      let seller = null

      if (isListed) {
        const listing = await marketplaceContract.getListing(
          process.env.NEXT_PUBLIC_NFT_ADDRESS,
          id
        )
        price = ethers.utils.formatUnits(listing.price.toString(), 'ether')
        seller = listing.seller
      }

      const owner = await nftContract.ownerOf(id)

      setNft({
        tokenId: id,
        image: metaData.image,
        name: metaData.name,
        description: metaData.description,
        isListed,
        price,
        seller,
        owner,
      })
    } catch (error) {
      console.log('Error loading NFT:', error)
    }
    setLoading(false)
  }

  async function buyNft() {
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
      router.push('/my-nfts')
    } catch (error) {
      console.log('Error buying NFT:', error)
    }
  }

  useEffect(() => {
    loadNFT()
  }, [id])

  if (loading) return <div>กำลังโหลด...</div>
  if (!nft) return <div>ไม่พบ NFT</div>

  return (
    <div className="flex flex-col min-h-screen">
      <ConnectWallet />
      <div className="flex justify-center">
        <div className="p-4">
          <div className="w-full md:w-96 border shadow rounded-xl overflow-hidden">
            <img
              src={nft.image}
              style={{ height: '400px', width: '100%', objectFit: 'cover' }}
            />
            <div className="p-4">
              <p className="text-3xl font-bold">{nft.name}</p>
              <p className="text-xl text-gray-400 mt-4">{nft.description}</p>
              <div className="mt-4">
                <p className="text-gray-600">
                  เจ้าของ: {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                </p>
                {nft.isListed && (
                  <>
                    <p className="text-gray-600">
                      ผู้ขาย: {nft.seller.slice(0, 6)}...{nft.seller.slice(-4)}
                    </p>
                    <p className="text-2xl font-bold mt-4">{nft.price} ETH</p>
                    <button
                      className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded mt-4"
                      onClick={buyNft}
                    >
                      ซื้อ NFT
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 