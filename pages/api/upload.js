import { IncomingForm } from 'formidable'
import { createReadStream } from 'fs'
import axios from 'axios'
import FormData from 'form-data'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const form = new IncomingForm()
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err)
        resolve([fields, files])
      })
    })

    const file = files.file[0]
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: 'Invalid file type' })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return res.status(400).json({ message: 'File too large' })
    }

    // Read file from temporary path
    const fileData = createReadStream(file.filepath)

    // Create form data
    const formData = new FormData()
    formData.append('file', fileData, {
      filename: file.originalFilename,
      contentType: file.mimetype,
    })

    // Upload to Pinata
    const pinataResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: 'Infinity',
        headers: {
          ...formData.getHeaders(),
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_API_SECRET,
        },
      }
    )

    // Clean up temporary file
    const fs = require('fs')
    fs.unlink(file.filepath, (err) => {
      if (err) console.error('Error deleting temporary file:', err)
    })

    return res.status(200).json({
      url: `https://gateway.pinata.cloud/ipfs/${pinataResponse.data.IpfsHash}`,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return res.status(500).json({ 
      message: 'Error uploading file',
      error: error.message 
    })
  }
} 