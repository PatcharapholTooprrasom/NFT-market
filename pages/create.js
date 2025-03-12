import { useState } from 'react'
import { ethers } from 'ethers'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'
import ConnectWallet from '../components/ConnectWallet'
import BasicNft from '../artifacts/contracts/BasicNft.sol/BasicNft.json'

export default function CreateNFT() {
  const [fileUrl, setFileUrl] = useState(null)
  const [formInput, setFormInput] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [error, setError] = useState(null)
  const router = useRouter()

  async function onChange(e) {
    const file = e.target.files[0]
    if (!file) {
      setUploadStatus('')
      setFileUrl(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setUploadStatus('กำลังอัพโหลดไฟล์...')
      
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์')
      }
      
      const data = await response.json()
      setFileUrl(data.url)
      setUploadStatus('อัพโหลดไฟล์สำเร็จ ✓')
    } catch (error) {
      console.error('Error uploading file:', error)
      setError(error.message)
      setUploadStatus('เกิดข้อผิดพลาดในการอัพโหลด ✗')
      setFileUrl(null)
    } finally {
      setLoading(false)
    }
  }

  async function createNFT() {
    const { name, description } = formInput
    if (!name || !description) {
      setError('กรุณากรอกชื่อและรายละเอียด NFT')
      return
    }
    
    if (!fileUrl) {
      setError('กรุณาอัพโหลดรูปภาพและรอจนกว่าการอัพโหลดจะเสร็จสมบูรณ์')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const web3Modal = new Web3Modal()
      const connection = await web3Modal.connect()
      const provider = new ethers.providers.Web3Provider(connection)
      const signer = provider.getSigner()

      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_NFT_ADDRESS,
        BasicNft.abi,
        signer
      )

      const metadata = {
        name,
        description,
        image: fileUrl,
      }

      const response = await fetch('/api/pin-json', {
        method: 'POST',
        body: JSON.stringify(metadata),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล metadata')
      }

      const { tokenUri } = await response.json()

      const transaction = await contract.mintNft(tokenUri)
      await transaction.wait()

      // Clear form and redirect to home page
      setFormInput({ name: '', description: '' })
      setFileUrl(null)
      setUploadStatus('')
      router.push('/')
    } catch (error) {
      console.error('Error creating NFT:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ConnectWallet />
      <div className="flex justify-center">
        <div className="w-1/2 flex flex-col pb-12">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}
          <input
            placeholder="ชื่อ NFT"
            className="mt-8 border rounded p-4"
            onChange={(e) => setFormInput({ ...formInput, name: e.target.value })}
            value={formInput.name}
            disabled={loading}
          />
          <textarea
            placeholder="รายละเอียด NFT"
            className="mt-2 border rounded p-4"
            onChange={(e) => setFormInput({ ...formInput, description: e.target.value })}
            value={formInput.description}
            disabled={loading}
          />
          <div className="mt-4">
            <input
              type="file"
              name="asset"
              className="mb-2"
              onChange={onChange}
              disabled={loading}
            />
            {uploadStatus && (
              <div className={`text-sm ${uploadStatus.includes('สำเร็จ') ? 'text-green-600' : uploadStatus.includes('ผิดพลาด') ? 'text-red-600' : 'text-blue-600'}`}>
                {uploadStatus}
              </div>
            )}
          </div>
          {fileUrl && <img className="rounded mt-4" width="350" src={fileUrl} />}
          <button
            onClick={createNFT}
            className={`font-bold mt-4 ${
              loading
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-pink-500 hover:bg-pink-600'
            } text-white rounded p-4 shadow-lg`}
            disabled={loading}
          >
            {loading ? 'กำลังดำเนินการ...' : 'สร้าง NFT'}
          </button>
        </div>
      </div>
    </div>
  )
} 