import { NFTStorage, Blob } from 'nft.storage'

const client = new NFTStorage({ 
  token: process.env.NEXT_PUBLIC_NFT_STORAGE_KEY! 
})

export async function uploadAudio(file: File): Promise<string> {
  const blob = new Blob([await file.arrayBuffer()], { type: file.type })
  const cid = await client.storeBlob(blob)
  return cid
}

export function getIPFSUrl(cid: string): string {
  return `https://nftstorage.link/ipfs/${cid}`
}
