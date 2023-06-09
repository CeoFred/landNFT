import { ethers } from 'ethers';
import { useState } from 'react';
import Web3Modal from 'web3modal';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import {useRouter} from 'next/router'

import { nftaddress, nftmarketaddress } from '../config';

import NFT from '../artifacts/contracts/LandNFT.sol/LandNFT.json'
import KBMarket from '../artifacts/contracts/LandMarket.sol/LandMarket.json'

// in this component we set the ipfs up to host our nft data of
// file storage
const auth =
    'Basic ' + Buffer.from("2PyK8IPprFLPUNIzUPGRMnwG4Mx" + ':' + "0131094c94982a63d41f035bbda2f5aa").toString('base64');
const client = ipfsHttpClient({
   host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: auth,
    },
});

export default function MintItem() {
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, updateFormInput] = useState({
    price: 0.1,
    name: '',
    description: '',
    landAddress: '',
    landSize: '',
    coordinates: '',
  });
  const router = useRouter();

  // set up a function to fireoff when we update files in our form - we can add our
  // NFT images - IPFS

  async function onChange(e) {
    const file = e.target.files[0];
    try {
      const added = await client.add(file, {
        progress: (prog) => console.log(`received: ${prog}`),
      });
      console.log(added);
      const url = `https://land-nft.infura-ipfs.io/ipfs/${added.path}`;
      setFileUrl(url);
    } catch (error) {
      console.log('Error uploading file:', error);
    }
  }

  async function createMarket() {
    const { name, description, price } = formInput;
    if (!name || !description || !price || !fileUrl) return;
    // upload to IPFS
    const data = JSON.stringify({
      name,
      description,
      image: fileUrl,
    });
    try {
      const added = await client.add(data);
      console.log(added);
      const url = `https://land-nft.infura-ipfs.io/ipfs/${added.path}`;
      // run a function that creates sale and passes in the url
      createSale(url);

    } catch (error) {
      console.log('Error uploading file:', error);
    }
  }

  async function createSale(url) {

    try {
          // create the items and list them on the marketplace
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    // we want to create the token
    let contract = new ethers.Contract(nftaddress, NFT.abi, signer);
    
    let transaction = await contract.mintToken(url);
   
    let tx = await transaction.wait();
    console.log('Transactions ====', tx);
    let event = tx.events[0];
    console.log('Transaction Events  ====', event);

    let value = event.args[2];
    let tokenId = value.toNumber();
    const price = ethers.utils.parseUnits(formInput.price, 'ether');

    // list the item for sale on the marketplace
    contract = new ethers.Contract(nftmarketaddress, KBMarket.abi, signer);
    let listingPrice = await contract.getListingPrice();
    listingPrice = listingPrice.toString();

    const { landAddress, landSize, coordinates } = formInput;

    transaction = await contract.makeMarketItem(nftaddress, tokenId, price, landAddress, coordinates, landSize,  {
      value: listingPrice,
    });
    await transaction.wait();
    router.push('./');
    } catch (error) {
        console.log(error);
    }

  }

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input
          placeholder="Land Name"
          className="mt-8 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, name: e.target.value })
          }
        />
        <textarea
          placeholder="Land Description"
          className="mt-2 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, description: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Land Price in Eth"
          className="mt-2 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, price: e.target.value })
          }
        />
        <textarea
          placeholder="Land Address"
          className="mt-2 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, landAddress: e.target.value })
          }
        />
        <input
          placeholder="Land Size"
          className="mt-8 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, landSize: e.target.value })
          }
        />
        <input
          placeholder="Land Coordinates"
          className="mt-8 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, coordinates: e.target.value })
          }
        />
        <input type="file" name="Asset" className="mt-4" onChange={onChange} />{' '}
        {fileUrl && (
          <img className="rounded mt-4" width="350px" src={fileUrl} />
        )}
        <button
          onClick={createMarket}
          className="font-bold mt-4 bg-purple-500 text-white rounded p-4 shadow-lg">
          Mint NFT
        </button>
      </div>
    </div>
  );
}
