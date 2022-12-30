// Next.js API route support: https://nextjs.org/docs/api-routes/introduction


// Base URI + TokenID
// Base URI = https://example.com
// Token ID = 1 

// tokenURI(1) => https://example.com/1

export default function handler(req, res) {
  const tokenId = req.query.tokenId;
  
  const name = `Crypto Dev #${tokenId}`;
  const description = "CryptoDevs is an test NFT Collection for Learn Web3 DAO";
  const image = `https://gateway.pinata.cloud/ipfs/QmcfsZCGdcXyHJP8MupMQwYuSET8TFJCHUhAaoJwe4EJuP/${
        Number(tokenId) - 1
    }.svg`; 

  return res.json({
    name: name,
    description: description,
    image: image,
  })

}
