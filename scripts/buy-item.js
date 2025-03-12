const { ethers } = require("hardhat")

async function buyItem() {
    const accounts = await ethers.getSigners()
    const buyer = accounts[1] // ใช้บัญชีที่ 2 เป็นผู้ซื้อ
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNft")

    // ดึงข้อมูล NFT ที่ listed ล่าสุด
    const tokenId = await basicNft.getTokenCounter() - 1
    const listing = await nftMarketplace.getListing(basicNft.address, tokenId)
    const price = listing.price

    console.log("Buying NFT...")
    const tx = await nftMarketplace.connect(buyer).buyItem(basicNft.address, tokenId, {
        value: price,
    })
    await tx.wait(1)
    console.log("NFT Bought!")
    console.log(`New owner: ${await basicNft.ownerOf(tokenId)}`)
}

buyItem()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    }) 