import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    let metadata
    try {
      metadata = JSON.parse(req.body)
    } catch (error) {
      return res.status(400).json({ message: 'Invalid JSON data' })
    }

    // Validate required fields
    if (!metadata.name || !metadata.description || !metadata.image) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['name', 'description', 'image'],
      })
    }

    // Add metadata for better discoverability
    const pinataMetadata = {
      name: metadata.name,
      keyvalues: {
        description: metadata.description,
        type: 'NFT Metadata',
      },
    }

    const pinataOptions = {
      cidVersion: 1,
    }

    const data = {
      pinataMetadata,
      pinataOptions,
      pinataContent: metadata,
    }

    const pinataResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_API_SECRET,
        },
        timeout: 10000, // 10 seconds timeout
      }
    )

    return res.status(200).json({
      tokenUri: `https://gateway.pinata.cloud/ipfs/${pinataResponse.data.IpfsHash}`,
      ipfsHash: pinataResponse.data.IpfsHash,
    })
  } catch (error) {
    console.error('Error pinning JSON:', error)
    return res.status(500).json({
      message: 'Error pinning JSON',
      error: error.response?.data || error.message,
    })
  }
} 