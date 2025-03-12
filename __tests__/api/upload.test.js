import { createMocks } from 'node-mocks-http'
import handler from '../../pages/api/upload'
import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'

jest.mock('axios')
jest.mock('formidable')
jest.mock('fs')

describe('/api/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Method not allowed',
    })
  })

  it('successfully uploads a file to Pinata', async () => {
    const mockFile = {
      filepath: '/tmp/mock-file',
      originalFilename: 'test.jpg',
      mimetype: 'image/jpeg',
    }

    const mockFormidable = require('formidable')
    mockFormidable.IncomingForm.mockImplementation(() => ({
      parse: (req, callback) => callback(null, {}, { file: mockFile }),
    }))

    fs.createReadStream.mockReturnValue('mock-file-stream')

    axios.post.mockResolvedValueOnce({
      data: {
        IpfsHash: 'mock-ipfs-hash',
      },
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        file: mockFile,
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({
      url: 'https://gateway.pinata.cloud/ipfs/mock-ipfs-hash',
    })
  })

  it('handles upload errors', async () => {
    const mockFile = {
      filepath: '/tmp/mock-file',
      originalFilename: 'test.jpg',
      mimetype: 'image/jpeg',
    }

    const mockFormidable = require('formidable')
    mockFormidable.IncomingForm.mockImplementation(() => ({
      parse: (req, callback) => callback(null, {}, { file: mockFile }),
    }))

    fs.createReadStream.mockReturnValue('mock-file-stream')

    axios.post.mockRejectedValueOnce(new Error('Upload failed'))

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        file: mockFile,
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Error uploading file',
    })
  })
}) 