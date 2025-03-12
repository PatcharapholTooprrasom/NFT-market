import { createMocks } from 'node-mocks-http'
import handler from '../../pages/api/pin-json'
import axios from 'axios'

jest.mock('axios')

describe('/api/pin-json', () => {
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

  it('successfully pins JSON metadata to Pinata', async () => {
    const mockMetadata = {
      name: 'Test NFT',
      description: 'Test Description',
      image: 'https://test.com/image.jpg',
    }

    axios.post.mockResolvedValueOnce({
      data: {
        IpfsHash: 'mock-ipfs-hash',
      },
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: JSON.stringify(mockMetadata),
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({
      tokenUri: 'https://gateway.pinata.cloud/ipfs/mock-ipfs-hash',
    })

    expect(axios.post).toHaveBeenCalledWith(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      mockMetadata,
      expect.any(Object)
    )
  })

  it('handles pinning errors', async () => {
    const mockMetadata = {
      name: 'Test NFT',
      description: 'Test Description',
      image: 'https://test.com/image.jpg',
    }

    axios.post.mockRejectedValueOnce(new Error('Pinning failed'))

    const { req, res } = createMocks({
      method: 'POST',
      body: JSON.stringify(mockMetadata),
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Error pinning JSON',
    })
  })
}) 