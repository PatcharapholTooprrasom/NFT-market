import '@testing-library/jest-dom'

// Mock window.ethereum
global.window = {
  ethereum: {
    isMetaMask: true,
    request: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
  },
}

// Mock environment variables
process.env = {
  ...process.env,
  NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS: '0x1234567890123456789012345678901234567890',
  NEXT_PUBLIC_NFT_ADDRESS: '0x0987654321098765432109876543210987654321',
  PINATA_API_KEY: 'test_api_key',
  PINATA_API_SECRET: 'test_api_secret',
} 